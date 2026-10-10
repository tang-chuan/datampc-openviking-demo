// 当前版本的前端请求构造及页面行为约定。
export const uiPolicy = {
  "version": "1.1.0-rc.1",
  "requestIdRequired": true,
  "reasonRequired": false,
  "disableSubmitWhilePending": true,
  "asyncRefund": false
};

export function buildRefundRequest(order, reason = "", requestId = undefined) {
  const headers = {"Content-Type": "application/json"};
  if (uiPolicy.requestIdRequired) {
    // 同一次操作应由页面保留 requestId；未传入时每次调用生成不同 ID。
    headers["X-Request-ID"] = requestId ?? globalThis.crypto.randomUUID();
  }
  const body = {...order};
  if (uiPolicy.reasonRequired) body.reason = reason;
  return {method: "POST", path: "/api/refunds", headers, body};
}

export function responseLabel(status, body) {
  if (status === 202 && body.status === "PENDING") return "退款处理中";
  if (status === 200 && body.status === "SUCCESS") return "退款成功";
  return "退款未完成";
}

// sendRequest(request) 返回 Promise<{status, body}>；不连接真实支付服务。
export function createRefundSubmitController(sendRequest) {
  if (typeof sendRequest !== "function") {
    throw new TypeError("sendRequest 必须是函数");
  }

  let requestSnapshot;
  let phase = "idle";
  let inFlight = null;
  const copy = (value) => JSON.parse(JSON.stringify(value));

  function send() {
    // 同步加锁，异步调用请求函数；也能捕获请求函数同步抛出的错误。
    phase = "pending";
    inFlight = Promise.resolve()
      .then(() => sendRequest(copy(requestSnapshot)))
      .then((result) => {
        phase = result?.status === 200 && result?.body?.status === "SUCCESS"
          ? "succeeded" : "uncertain";
        return result;
      }, (error) => {
        phase = "uncertain";
        throw error;
      })
      .finally(() => { inFlight = null; });
    return inFlight;
  }

  return {
    get state() {
      return Object.freeze({
        phase,
        pending: phase === "pending",
        canRetry: phase === "uncertain",
        requestId: requestSnapshot?.headers["X-Request-ID"] ?? null
      });
    },
    startOperation(order, reason = "") {
      if (inFlight) throw new Error("请求进行中，不能开始新操作");
      // ID 由控制器生成；对 JSON 请求做深快照，隔离表单和传输函数的修改。
      const request = buildRefundRequest(order, reason, globalThis.crypto.randomUUID());
      requestSnapshot = copy(request);
      phase = "ready";
      return this.state;
    },
    submit() {
      if (inFlight) return inFlight;
      if (phase !== "ready") {
        throw new Error("请先开始新操作；结果不确定时请使用 retry()");
      }
      return send();
    },
    retry() {
      if (inFlight) return inFlight;
      if (phase !== "uncertain") throw new Error("当前操作不需要重试");
      // 无退款内容参数：重试只能发送原请求，不能以旧 ID 替换内容。
      return send();
    }
  };
}

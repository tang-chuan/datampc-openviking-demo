// 当前版本的前端请求构造及页面行为约定。
export const uiPolicy = {
  "version": "1.1.0-rc.1",
  "requestIdRequired": true,
  "reasonRequired": false,
  "disableSubmitWhilePending": false,
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

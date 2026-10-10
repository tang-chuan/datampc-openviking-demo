# 前端接入说明

当前版本：1.1.0-rc.1。
支付天数和金额上限使用后端规则 7 天 / 2500 元。
X-Request-ID：必须。reason：不要求。
同步完成：HTTP 200，返回 refundId 和 SUCCESS。仅为模拟结果。

请求和结果展示函数见 frontend/refund.mjs。
提交期间禁用按钮约定：true。
真实页面事件绑定、支付连接和 E2E 测试均不属于当前最小样例。
已知问题详见 docs/known-issues.md。

## 提交控制器

`createRefundSubmitController(sendRequest)` 允许注入模拟异步请求函数。
请求函数接收 `{method, path, headers, body}`，返回 Promise，结果形如
`{status: 200, body: {refundId: "RF-ORDER-001", status: "SUCCESS"}}`。
网络失败应抛错或拒绝 Promise；控制器保留请求供重试，并向调用方传递错误。

- `startOperation(order, reason)`：明确开始新退款操作，生成新 X-Request-ID 并保存
  JSON 请求的深快照。进行中禁止开始新操作。不要在每次点击或重试时调用它。
- `submit()`：发送已准备的操作。进行中再次调用返回同一个 Promise，不重复发送。
  已完成或结果不确定时不能再次 submit，需明确选择新操作或 retry。
- `retry()`：失败或结果不确定时发送原 ID、原请求内容，不接受新的退款内容。
  进行中再次 retry 也复用同一个 Promise；成功后不能重试。
- `state`：只读状态快照，包含 `phase`、`pending`、`canRetry` 和 `requestId`。
  `pending` 在 submit/retry 返回 Promise 前同步置为 true，可绑定按钮禁用状态。
  页面需在调用后及 Promise 结束后读取最新 state，不要长期保留旧状态快照。

phase 为 idle、ready、pending、succeeded 或 uncertain。只有 HTTP 200 且
body.status 为 SUCCESS 时判定成功；其他返回值保守标记 uncertain 并保留原请求，
页面仍须根据接口错误码展示错误。明确的参数错误应修正内容后开始新操作。
结果不确定时优先 retry；startOperation 表示主动开始另一操作，不是恢复旧操作。
控制器只在内存中保存操作，刷新页面或重新创建控制器后不会恢复旧请求。

以下为页面可采用的绑定示例，尚未接入真实页面：

```js
import {createRefundSubmitController} from "./frontend/refund.mjs";

// 注入模拟函数；也可以在接入时提供遵守同一请求/结果约定的适配器。
const controller = createRefundSubmitController(async (request) => {
  return {status: 200, body: {refundId: `RF-${request.body.orderId}`, status: "SUCCESS"}};
});

function renderState() {
  submitButton.disabled = controller.state.pending;
  retryButton.disabled = controller.state.pending || !controller.state.canRetry;
}

// 仅在用户明确开始新操作时执行；重试不会重新读取表单。
function beginRefund(order) {
  controller.startOperation(order);
  renderState();
}

async function run(retry = false) {
  try {
    const pending = retry ? controller.retry() : controller.submit();
    renderState();
    const result = await pending;
    showResult(result);
  } catch (error) {
    showError(error);
  } finally {
    renderState();
  }
}

submitButton.onclick = () => run();
retryButton.onclick = () => run(true);
beginRefund({orderId: "ORDER-001", daysSincePayment: 7, amount: 2500});
```

本轮 `node --test frontend/refund.test.mjs` 的 5 项测试通过，验证的是模拟请求与
控制器逻辑，没有真实页面或浏览器 E2E 验收。BUG-101 状态为 FIXED_PENDING_QA。

测试环境参考资料：
- viking://resources/refund-demo/default/testing/docs/known-issues.md
- viking://resources/refund-demo/default/testing/docs/frontend-integration.md
- viking://resources/refund-demo/default/testing/docs/refund-api.md

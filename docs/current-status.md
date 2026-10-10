# 当前有效功能状态

功能版本：1.1.0-rc.1。本文和当前源码是本版本现状，不是其他环境的部署证明。

- 退款期限：支付后 7 天以内，恰好第 7 天仍允许。
- 单次退款金额上限：2500 元，恰好上限仍允许；金额必须大于 0。
- X-Request-ID：必须。
- reason：不要求。
- 响应行为：同步完成：HTTP 200，返回 refundId 和 SUCCESS。仅为模拟结果。
- 部分退款：未实现，不得当作当前可用能力。

金额和支付天数由调用者提供，样例不校验真实订单。

## BUG-101 修复状态

当前工作分支已实现提交控制器，状态为 FIXED_PENDING_QA：
提交期间禁用按钮约定为 true，并通过同步进行中守卫阻止重复请求；
同一次操作失败或结果不确定时，重试复用原 X-Request-ID 和原请求内容；
新操作生成新 ID，进行中不允许切换操作。

`node --test frontend/refund.test.mjs`：5 项测试通过。
本轮验证的是模拟请求与控制器逻辑，没有真实页面或浏览器 E2E 验收。
真实页面接入与 QA 尚未完成；本记录不是部署证明。
退款期限 7 天、金额上限 2500 元及后端接口约定保持不变。

测试环境参考基线：
- viking://resources/refund-demo/default/testing/docs/known-issues.md
- viking://resources/refund-demo/default/testing/docs/current-status.md
- viking://resources/refund-demo/default/testing/docs/refund-api.md

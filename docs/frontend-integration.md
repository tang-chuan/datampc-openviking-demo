# 前端接入说明

当前版本：1.2.0-dev.1。
支付天数和金额上限使用后端规则 14 天 / 5000 元。
X-Request-ID：必须。reason：必填。
异步受理：HTTP 202，返回 taskId 和 PENDING。PENDING 不能展示为退款成功；当前样例尚未实现任务状态查询和实际退款执行。

请求和结果展示函数见 frontend/refund.mjs。
提交期间禁用按钮约定：true。
真实页面事件绑定、支付连接和 E2E 测试均不属于当前最小样例。
已知问题详见 docs/known-issues.md。

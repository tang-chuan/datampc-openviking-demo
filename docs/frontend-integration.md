# 前端接入说明

当前版本：1.0.0。
支付天数和金额上限使用后端规则 3 天 / 1000 元。
X-Request-ID：不要求；当前版本不提供幂等保证。reason：不要求。
同步完成：HTTP 200，返回 refundId 和 SUCCESS。仅为模拟结果。

请求和结果展示函数见 frontend/refund.mjs。
提交期间禁用按钮约定：true。
真实页面事件绑定、支付连接和 E2E 测试均不属于当前最小样例。
已知问题详见 docs/known-issues.md。

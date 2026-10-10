# 当前缺陷和限制

## BUG-101：连续点击可能创建两次退款

状态：OPEN。前端负责人：zhangsan；后端负责人：admin。
复现：一次请求未返回时再点击退款。当前 uiPolicy.disableSubmitWhilePending=false；
两次 buildRefundRequest 未传入相同 requestId 时会生成不同 ID。
后端只对相同 X-Request-ID 幂等，因此无法合并这两次请求。
修复要求：提交期间禁用按钮，同一次用户操作重试时复用 requestId。
验收：连续点击只有一次请求；网络重试使用原 ID。
对应证据：frontend/refund.mjs。当前模拟函数不包含真实页面事件绑定。

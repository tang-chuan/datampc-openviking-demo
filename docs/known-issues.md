# 当前缺陷和限制

## BUG-101：连续点击可能创建两次退款

状态：FIXED_PENDING_QA。前端负责人：zhangsan；后端负责人：admin。
原复现：一次请求未返回时再点击退款。修复前 uiPolicy.disableSubmitWhilePending=false；
两次 buildRefundRequest 未传入相同 requestId 时会生成不同 ID。
后端只对相同 X-Request-ID 幂等，因此无法合并这两次请求。
修复要求：提交期间禁用按钮，同一次用户操作重试时复用 requestId。
验收：连续点击只有一次请求；网络重试使用原 ID。
修复：frontend/refund.mjs 新增 createRefundSubmitController，提交期间同步加锁，
重复提交返回同一个进行中的 Promise，不发送第二个请求；disableSubmitWhilePending=true。
startOperation 创建新 ID 和请求深快照；retry 只复用原 ID 和原请求，不接受退款内容。
请求函数收到快照的副本，表单或请求函数修改对象不会改变重试内容。

验证：运行 `node --test frontend/refund.test.mjs`，5 项测试通过。
覆盖进行中连续提交只发送一次请求、网络失败后重试保持 ID 和内容、
新操作生成新 ID、结果不确定时重试、同步抛错后释放锁，及请求内容修改隔离。
本轮验证的是模拟请求与控制器逻辑，没有真实页面或浏览器 E2E 验收。
真实页面事件绑定和按钮交互仍待 QA；状态不代表已部署或真实支付退款通过验收。

测试环境参考基线：
- viking://resources/refund-demo/default/testing/docs/known-issues.md
- viking://resources/refund-demo/default/testing/docs/refund-api.md

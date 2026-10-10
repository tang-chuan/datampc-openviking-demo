# 当前缺陷和限制

## BUG-101：修复待验收

状态：FIXED_PENDING_QA。uiPolicy.disableSubmitWhilePending=true；
页面接入时必须实际执行禁用，并为同一次操作保留 requestId。
配置和请求构造函数已经更新，但尚无真实浏览器页面，因此不能声称完成 UI 验收。

## TASK-202：异步退款任务查询

状态：TODO。当前只能返回 taskId 和 PENDING，尚未实现查询接口或任务执行。
不能声称异步退款已完成端到端验证。

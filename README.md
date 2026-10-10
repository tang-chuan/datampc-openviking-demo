# DataMPC 订单退款演练

当前功能版本：1.2.0-dev.1。当前有效行为以 docs/current-status.md、
docs/refund-api.md 和 backend/refund-policy.json 为准。

这是用于知识检索和团队协作的最小样例，不连接真实支付服务。
源码与文档仅描述当前版本，不包含其他阶段的答案矩阵。
同一代码版本处于哪个环境，由外部的分支映射和部署记录决定。

运行后端样例：`python3 backend/refunds.py`。
前端请求构造逻辑见 frontend/refund.mjs；它不是完整 Web 应用。

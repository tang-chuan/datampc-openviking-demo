# 退款接口契约

当前版本：1.0.0；模拟接口：POST /api/refunds。
backend/refunds.py 提供等效函数，并没有启动 HTTP 服务。

请求字段：orderId、daysSincePayment、amount；reason 为不要求。
请求头 X-Request-ID：不要求；当前版本不提供幂等保证。
amount 的单位为整数元。daysSincePayment 是支付后经过的天数。

成功响应：HTTP 200

```json
{"refundId":"RF-ORDER-001","status":"SUCCESS"}
```

超出退款期限：HTTP 422 / REFUND_WINDOW_EXCEEDED。
金额无效或超上限：HTTP 422 / REFUND_AMOUNT_INVALID。
缺少必需请求头：HTTP 400 / REQUEST_ID_REQUIRED，仅在要求该头的版本生效。
缺少必需原因：HTTP 400 / REFUND_REASON_REQUIRED，仅在要求原因的版本生效。
当前规则：3 天、1000 元。未实现部分退款。
要求 X-Request-ID 的版本仅在当前进程内模拟相同请求的幂等响应。

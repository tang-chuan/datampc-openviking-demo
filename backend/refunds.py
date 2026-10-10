"""退款规则演练。仅模拟校验、响应和进程内幂等，不连接支付系统。"""
import json
from pathlib import Path

RULES = json.loads((Path(__file__).parent / "refund-policy.json").read_text())
_responses = {}


def create_refund(payload, headers=None):
    headers = headers or {}
    request_id = headers.get("X-Request-ID")
    if RULES["request_id_required"] and not request_id:
        return 400, {"error": "REQUEST_ID_REQUIRED"}
    # 所有金额都是整数元，仅用于演练。
    if payload.get("daysSincePayment", 999) > RULES["refund_window_days"]:
        return 422, {"error": "REFUND_WINDOW_EXCEEDED"}
    amount = payload.get("amount", 0)
    if amount <= 0 or amount > RULES["max_refund_amount_yuan"]:
        return 422, {"error": "REFUND_AMOUNT_INVALID"}
    if RULES["reason_required"] and not payload.get("reason"):
        return 400, {"error": "REFUND_REASON_REQUIRED"}
    # 本例约定 request_id 与同一个请求绑定；真实服务还需校验载荷一致性。
    if RULES["request_id_required"] and request_id in _responses:
        return _responses[request_id]
    suffix = payload.get("orderId", "demo")
    if RULES["async_refund"]:
        response = 202, {"taskId": "TK-" + suffix, "status": "PENDING"}
    else:
        response = 200, {"refundId": "RF-" + suffix, "status": "SUCCESS"}
    if RULES["request_id_required"]:
        _responses[request_id] = response
    return response


if __name__ == "__main__":
    status, body = create_refund(
        {"orderId": "ORDER-001", "daysSincePayment": 2,
         "amount": 900, "reason": "客户主动取消"},
        {"X-Request-ID": "demo-request-001"},
    )
    print(json.dumps({"httpStatus": status, "body": body}, ensure_ascii=False))

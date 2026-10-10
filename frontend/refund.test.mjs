import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createRefundSubmitController, uiPolicy } from "./refund.mjs";

// Node 18 的脚本环境默认未暴露全局 Web Crypto；与浏览器使用相同 API。
globalThis.crypto ??= webcrypto;

const order = () => ({orderId: "ORDER-001", daysSincePayment: 7, amount: 2500});
const success = {status: 200, body: {refundId: "RF-ORDER-001", status: "SUCCESS"}};

test("未结束时连续提交只发送一次请求，状态可绑定按钮", async () => {
  const calls = [];
  let finish;
  const controller = createRefundSubmitController((request) => {
    calls.push(request);
    return new Promise((resolve) => { finish = resolve; });
  });
  assert.equal(uiPolicy.disableSubmitWhilePending, true);
  controller.startOperation(order());
  const first = controller.submit();
  assert.equal(controller.state.pending, true);
  assert.strictEqual(controller.submit(), first);
  assert.throws(() => controller.startOperation(order()), /进行中/);
  await Promise.resolve();
  assert.strictEqual(controller.submit(), first);
  assert.equal(calls.length, 1);
  finish(success);
  assert.deepEqual(await first, success);
  assert.equal(controller.state.pending, false);
  assert.equal(controller.state.phase, "succeeded");
  assert.throws(() => controller.submit(), /新操作/);
  assert.throws(() => controller.retry(), /不需要重试/);
});

test("网络失败后重试复用 ID 和原请求，隔离表单及传输函数修改", async () => {
  const calls = [];
  const controller = createRefundSubmitController(async (request) => {
    calls.push(structuredClone(request));
    if (calls.length === 1) {
      request.body.amount = 1;
      request.body.extra.note = "transport changed";
      request.headers["X-Request-ID"] = "transport changed";
      throw new Error("network failure");
    }
    return success;
  });
  const input = {...order(), extra: {note: "original"}};
  controller.startOperation(input);
  input.amount = 2;
  input.extra.note = "form changed";
  await assert.rejects(controller.submit(), /network failure/);
  assert.equal(controller.state.pending, false);
  assert.equal(controller.state.canRetry, true);
  assert.throws(() => controller.submit(), /retry/);
  const retry = controller.retry();
  assert.strictEqual(controller.retry(), retry);
  await retry;
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], calls[0]);
  assert.equal(calls[1].body.amount, 2500);
  assert.equal(calls[1].body.extra.note, "original");
  assert.equal(calls[1].method, "POST");
  assert.equal(calls[1].path, "/api/refunds");
  assert.equal(calls[1].headers["Content-Type"], "application/json");
  assert.ok(calls[1].headers["X-Request-ID"]);
});

test("新操作生成新 ID，包括退款内容相同或改变时", async () => {
  const calls = [];
  const controller = createRefundSubmitController(async (request) => {
    calls.push(request);
    return success;
  });
  for (const input of [order(), order(), {...order(), orderId: "ORDER-002", amount: 100}]) {
    controller.startOperation(input);
    await controller.submit();
  }
  assert.equal(new Set(calls.map((request) => request.headers["X-Request-ID"])).size, 3);
  assert.deepEqual(calls[0].body, calls[1].body);
  assert.equal(calls[2].body.orderId, "ORDER-002");
});

test("结果不确定时保留原请求供重试，显式新操作才更换 ID", async () => {
  const calls = [];
  const controller = createRefundSubmitController(async (request) => {
    calls.push(request);
    return {status: 503, body: {status: "UNKNOWN"}};
  });
  controller.startOperation(order());
  await controller.submit();
  assert.equal(controller.state.canRetry, true);
  await controller.retry();
  assert.deepEqual(calls[1], calls[0]);
  controller.startOperation({...order(), amount: 100});
  await controller.submit();
  assert.notEqual(calls[2].headers["X-Request-ID"], calls[0].headers["X-Request-ID"]);
});

test("请求函数同步抛错也释放锁并允许复用原 ID 重试", async () => {
  const calls = [];
  const controller = createRefundSubmitController((request) => {
    calls.push(request);
    if (calls.length === 1) throw new Error("sync failure");
    return Promise.resolve(success);
  });
  assert.throws(() => controller.submit(), /新操作/);
  controller.startOperation(order());
  await assert.rejects(controller.submit(), /sync failure/);
  assert.equal(controller.state.pending, false);
  await controller.retry();
  assert.deepEqual(calls[1], calls[0]);
});

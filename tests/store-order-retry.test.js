/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { storeOrderRetryAction } = require("../lib/store-expert/order-retry");

test("only a definite failure with released reservation starts a new order", () => {
  assert.equal(storeOrderRetryAction({ status: "failed", orderObjectId: null }), "new");
  assert.equal(storeOrderRetryAction({ status: "failed", orderObjectId: "1", order: { inventoryReservationStatus: "released" } }), "new");
  assert.equal(storeOrderRetryAction({ status: "failed", orderObjectId: "1", order: { inventoryReservationStatus: "release_pending" } }), "blocked");
  assert.equal(storeOrderRetryAction({ status: "failed", orderObjectId: "1", order: null }), "blocked");
});

test("uncertain and completed operations are inspected, while invoice recovery reuses the operation", () => {
  for (const status of ["creating", "reserving", "quoting", "pending_verification", "completed"]) {
    assert.equal(storeOrderRetryAction({ status }), "inspect", status);
  }
  assert.equal(storeOrderRetryAction({ status: "invoice_pending" }), "resume");
});

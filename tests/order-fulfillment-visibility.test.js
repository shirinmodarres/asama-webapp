/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { showOrderFulfillment } = require("../lib/domain/order-fulfillment-visibility");

const order = (orderStatus, fields = {}) => ({
  orderStatus, warehouseStatus: "reserved", approvedBy: null, exitSlipObjectId: null, ...fields,
});

test("summary is hidden before manager approval including financial approval and correction", () => {
  for (const status of [
    "pending_approval", "pending_financial_approval", "pending_manager_approval",
    "needs_review", "review_resolved", "rejected", "voided",
    "store_quotation_pending", "store_quotation_failed",
  ]) {
    assert.equal(showOrderFulfillment(order(status)), false, status);
  }
});

test("summary is visible after manager approval including systems transfer and completion", () => {
  for (const status of ["approved", "invoiced", "completed"]) {
    assert.equal(showOrderFulfillment(order(status)), true, status);
  }
  assert.equal(showOrderFulfillment(order("approved", {
    financialApprovalStage: "systems_transfer", warehouseStatus: "awaitingSystemsTransfer",
    financialApprovalStatus: "needs_correction",
  })), true);
});

test("terminal orders require existing evidence that approval or dispatch occurred", () => {
  for (const status of ["cancelled", "returned", "returnedAfterInvoice"]) {
    assert.equal(showOrderFulfillment(order(status)), false, status);
    assert.equal(showOrderFulfillment(order(status, { approvedBy: "مدیر" })), true, status);
    assert.equal(showOrderFulfillment(order(status, { exitSlipObjectId: "slip" })), true, status);
    assert.equal(showOrderFulfillment(order(status, { warehouseStatus: "delivered" })), true, status);
    assert.equal(showOrderFulfillment(order(status, { warehouseStatus: "reviewing" })), true, status);
  }
});

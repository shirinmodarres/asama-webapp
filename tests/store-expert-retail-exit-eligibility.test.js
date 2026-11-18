/* eslint-disable @typescript-eslint/no-require-imports */

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hasPendingRetailFulfillment,
  retailItems,
} = require("../lib/store-expert/retail-exit-eligibility");

test("Store exit remains available for a pending retail item in a mixed order", () => {
  const order = {
    // The order-level warehouse status may describe the other warehouse and
    // must never decide whether the retail item can be fulfilled.
    warehouseStatus: "reserved",
    retailPendingOrderItemObjectIds: ["retail-item"],
    retailOrderItemObjectIds: ["retail-item"],
    retailStockObjectIds: ["retail-stock"],
    items: [
      { objectId: "retail-item", quantity: 1, dispatchedQuantity: 0 },
      { objectId: "zagros-item", quantity: 1, dispatchedQuantity: 0 },
    ],
  };

  assert.equal(hasPendingRetailFulfillment(order), true);
  assert.deepEqual(
    retailItems(order, true).map((item) => item.objectId),
    ["retail-item"],
  );
});

test("Store exit is unavailable when no retail reservation remains active", () => {
  const order = {
    retailPendingOrderItemObjectIds: [],
    retailOrderItemObjectIds: ["retail-item"],
    items: [{ objectId: "retail-item", quantity: 1, dispatchedQuantity: 1 }],
  };

  assert.equal(hasPendingRetailFulfillment(order), false);
});

test("Store detail trusts the server retail eligibility for an active reservation", () => {
  const order = {
    // The detail response may not contain a complete item snapshot for every
    // legacy order. Backend eligibility remains the canonical decision.
    retailExitAvailable: true,
    retailPendingOrderItemObjectIds: [],
    items: [],
  };

  assert.equal(hasPendingRetailFulfillment(order), true);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildQuotationSubmitPayload,
  getQuotationCustomerSnapshot,
  getQuotationSalesTypeSnapshot,
} = require("../components/quotations/quotation-form.logic.js");

test("buildQuotationSubmitPayload preserves edit fields and items", () => {
  const payload = buildQuotationSubmitPayload({
    selectedCustomerId: "cust-1",
    selectedSalesTypeId: "st-1",
    selectedSalesType: {
      objectId: "parse-st-1",
      title: "Cash",
      internalCode: 10,
      sepidarCode: 1,
    },
    selectedPriceListId: "pl-1",
    notes: "  hello  ",
    selectedValidUntil: "2026-08-01",
    discountPercentage: 10,
    taxPercentage: 10,
    stockObjectId: "stock-1",
    adjustments: [],
    status: "draft",
    rows: [{ productId: "prod-1", quantity: 2 }],
  });

  assert.deepEqual(payload, {
    customerObjectId: "cust-1",
    salesTypeObjectId: "parse-st-1",
    salesTypeTitle: "Cash",
    salesTypeInternalCode: 10,
    salesTypeSepidarCode: 1,
    priceListObjectId: "pl-1",
    notes: "hello",
    validUntil: "2026-08-01",
    discountPercentage: 10,
    taxPercentage: 10,
    stockObjectId: "stock-1",
    adjustments: [],
    status: "draft",
    items: [{ productObjectId: "prod-1", quantity: 2 }],
  });
});

test("quotation snapshots keep legacy sales type and customer data", () => {
  const salesType = getQuotationSalesTypeSnapshot({
    objectId: "q-1",
    salesTypeTitle: "بازار (نقد)",
    salesTypeInternalCode: 11000,
    salesTypeSepidarCode: 204,
  });
  const customer = getQuotationCustomerSnapshot({
    customerObjectId: "cust-1",
    customer: { objectId: "cust-1", id: "cust-1", fullName: "مشتری تست" },
  });

  assert.equal(salesType?.objectId, "quotation-sales-type-q-1");
  assert.equal(salesType?.title, "بازار (نقد)");
  assert.equal(customer?.objectId, "cust-1");
  assert.equal(customer?.fullName, "مشتری تست");
});

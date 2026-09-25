function getQuotationSalesTypeSnapshot(quotation) {
  if (!quotation) return null;
  const objectId = quotation.salesTypeObjectId || quotation.salesType?.objectId || "";
  const title = quotation.salesTypeTitle || quotation.salesType?.title || "";
  const internalCode = quotation.salesTypeInternalCode ?? quotation.salesType?.internalCode ?? null;
  const sepidarCode = quotation.salesTypeSepidarCode ?? quotation.salesType?.sepidarCode ?? null;
  if (!objectId && !title && internalCode === null && sepidarCode === null) return null;
  return {
    objectId: objectId || `quotation-sales-type-${quotation.objectId || "fallback"}`,
    title,
    internalCode,
    sepidarCode,
  };
}

function getQuotationSalesTypeOptionKey(quotation) {
  if (!quotation) return "";
  const snapshot = getQuotationSalesTypeSnapshot(quotation);
  if (!snapshot) return "";
  if (snapshot.sepidarCode !== null && snapshot.sepidarCode !== undefined) {
    return String(snapshot.sepidarCode);
  }
  if (snapshot.internalCode !== null && snapshot.internalCode !== undefined) {
    return String(snapshot.internalCode);
  }
  return snapshot.objectId || "";
}

function getQuotationCustomerSnapshot(quotation) {
  if (!quotation?.customer) return null;
  return {
    ...quotation.customer,
    objectId: quotation.customerObjectId || quotation.customer.objectId,
    id: quotation.customer.id || quotation.customerObjectId || quotation.customer.objectId,
    fullName:
      quotation.customer.fullName ||
      quotation.customerObjectId ||
      "",
  };
}

function buildQuotationSubmitPayload({
  selectedCustomerId,
  selectedSalesTypeId,
  selectedSalesType,
  selectedPriceListId,
  notes,
  selectedValidUntil,
  discountPercentage,
  taxPercentage,
  stockObjectId,
  adjustments,
  status,
  rows,
}) {
  return {
    customerObjectId: selectedCustomerId,
    salesTypeObjectId: selectedSalesTypeId,
    salesTypeTitle: selectedSalesType?.title ?? null,
    salesTypeInternalCode: selectedSalesType?.internalCode ?? null,
    salesTypeSepidarCode: selectedSalesType?.sepidarCode ?? null,
    priceListObjectId: selectedPriceListId,
    notes: notes.trim(),
    validUntil: selectedValidUntil || null,
    discountPercentage,
    taxPercentage,
    stockObjectId,
    adjustments,
    status,
    items: rows.map((row) => ({
      productObjectId: row.productId,
      quantity: row.quantity,
    })),
  };
}

module.exports = {
  buildQuotationSubmitPayload,
  getQuotationCustomerSnapshot,
  getQuotationSalesTypeSnapshot,
  getQuotationSalesTypeOptionKey,
};

const RETAIL_SEPIDAR_STOCK_ID = 56;

function isRetailShowroomTitle(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200d\s_-]+/g, "")
    .includes("نمایشگاهتکفروشی");
}

function retailItems(order, pendingOnly = false) {
  const retailStockIds = new Set(order.retailStockObjectIds || []);
  const retailItemIds = new Set(
    pendingOnly
      ? order.retailPendingOrderItemObjectIds || []
      : order.retailOrderItemObjectIds || [],
  );

  return (order.items || []).filter((item) => {
    if (retailItemIds.has(item.objectId)) return true;
    if (pendingOnly) return false;

    return (
      Number(item.sepidarStockId) === RETAIL_SEPIDAR_STOCK_ID ||
      Boolean(item.stockObjectId && retailStockIds.has(item.stockObjectId)) ||
      isRetailShowroomTitle(item.stockTitle) ||
      Boolean(
        item.stockAllocations?.some(
          (allocation) =>
            Number(allocation.sepidarStockId) === RETAIL_SEPIDAR_STOCK_ID ||
            isRetailShowroomTitle(allocation.stockTitle) ||
            Boolean(
              allocation.stockObjectId &&
                retailStockIds.has(allocation.stockObjectId),
            ),
        ),
      )
    );
  });
}

function hasPendingRetailFulfillment(order) {
  if (typeof order?.retailExitAvailable === "boolean") {
    return order.retailExitAvailable;
  }
  return retailItems(order, true).some(
    (item) => Number(item.quantity) > Number(item.dispatchedQuantity || 0),
  );
}

function hasRetailFulfillmentRemaining(order) {
  return retailItems(order, false).some(
    (item) => Number(item.quantity) > Number(item.dispatchedQuantity || 0),
  );
}

module.exports = {
  RETAIL_SEPIDAR_STOCK_ID,
  isRetailShowroomTitle,
  retailItems,
  hasPendingRetailFulfillment,
  hasRetailFulfillmentRemaining,
};

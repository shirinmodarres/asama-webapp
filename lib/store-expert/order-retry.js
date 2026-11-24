function storeOrderRetryAction(operation) {
  if (operation.status === "failed") {
    if (!operation.orderObjectId) return "new";
    if (operation.order?.inventoryReservationStatus === "released") return "new";
    return "blocked";
  }
  if (operation.status === "invoice_pending") return "resume";
  return "inspect";
}

module.exports = { storeOrderRetryAction };

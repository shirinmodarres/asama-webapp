function showOrderFulfillment(order) {
  if (['approved', 'invoiced', 'completed'].includes(order.orderStatus)) return true;

  if (['cancelled', 'returned', 'returnedAfterInvoice'].includes(order.orderStatus)) {
    return Boolean(order.approvedBy || order.exitSlipObjectId)
      || ['awaitingSystemsTransfer', 'reviewing', 'awaitingNajaDetails',
        'najaDetailsCompleted', 'partialDispatch', 'dispatchIssued', 'delivered', 'completed']
        .includes(order.warehouseStatus);
  }

  return false;
}

module.exports = { showOrderFulfillment };

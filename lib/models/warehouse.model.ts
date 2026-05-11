export interface ExitSlip {
  objectId: string;
  id: string;
  slipCode: string;
  orderId: string;
  orderCode: string;
  issuedByName: string;
  exitDate: string;
  notes: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryFullAddress: string | null;
  receiverFullName: string | null;
  receiverPhone: string | null;
  deliveryConfirmed: boolean;
  deliveryConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExitSlipPayload {
  slipCode?: string;
  exitDate: string;
  issuedByName?: string;
  notes?: string;
}

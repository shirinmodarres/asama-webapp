import type { StoreOrderSubmission } from "@/lib/services/store-expert-order.service";

export function storeOrderRetryAction(operation: StoreOrderSubmission): "new" | "resume" | "inspect" | "blocked";

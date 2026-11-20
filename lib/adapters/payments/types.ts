export type PaymentMethod = "ideal" | "creditcard" | "directdebit";
export type PaymentStatus = "open" | "paid" | "failed" | "expired" | "canceled";

export interface PaymentsAdapter {
  createPayment(input: {
    amountCents: number;
    description: string;
    method?: PaymentMethod;
    redirectUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ id: string; checkoutUrl: string; status: PaymentStatus }>;
  getPayment(id: string): Promise<{ id: string; status: PaymentStatus; amountCents: number }>;
}

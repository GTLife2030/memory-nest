import type { PaymentsAdapter } from "./types";

const amounts = new Map<string, number>();

export const createMockPayments = (): PaymentsAdapter => ({
  async createPayment({ amountCents, redirectUrl }) {
    const id = `tr_demo_${amounts.size + 1}`;
    amounts.set(id, amountCents);
    // Demo mode skips the bank and sends the visitor straight back.
    return { id, checkoutUrl: redirectUrl, status: "open" };
  },
  async getPayment(id) {
    return { id, status: "paid", amountCents: amounts.get(id) ?? 0 };
  },
});

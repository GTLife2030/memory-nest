import type { PrintAdapter } from "./types";

export const createMockPrint = (): PrintAdapter => ({
  async quote({ pageCount, copies }) {
    // Shaped like a hardcover quote; real prices come from the print partner after the proof prints.
    return { priceCents: (520 + pageCount * 6) * copies, shippingCents: 590, productionDays: 5 };
  },
  async createOrder({ bookId }) {
    return { providerRef: `DEMO-${bookId.slice(0, 8).toUpperCase()}`, status: "created" };
  },
  async getOrder(providerRef) {
    return { providerRef, status: "in_production", trackingUrl: null };
  },
});

export type PrintTemplate = "linnen" | "zand" | "eerste_jaar";
export type PrintOrderStatus = "created" | "in_production" | "shipped" | "delivered" | "cancelled";
export type PostalAddress = { name: string; street: string; postalCode: string; city: string; country: "NL" | "BE" };

export interface PrintAdapter {
  quote(input: { template: PrintTemplate; pageCount: number; copies: number }): Promise<{ priceCents: number; shippingCents: number; productionDays: number }>;
  createOrder(input: { bookId: string; pdfUrl: string; template: PrintTemplate; pageCount: number; copies: number; address: PostalAddress }): Promise<{ providerRef: string; status: PrintOrderStatus }>;
  getOrder(providerRef: string): Promise<{ providerRef: string; status: PrintOrderStatus; trackingUrl: string | null }>;
}

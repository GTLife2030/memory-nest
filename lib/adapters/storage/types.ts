export type Bucket = "media" | "capsules" | "books" | "exports" | "evidence";

export interface StorageAdapter {
  /** Short-lived read URL. Callers must already have checked that the user may read the object. */
  createSignedUrl(input: { bucket: Bucket; path: string; expiresInS: number }): Promise<{ url: string; expiresAt: Date }>;
  createUploadUrl(input: { bucket: Bucket; path: string }): Promise<{ url: string; path: string }>;
}

import type { StorageAdapter } from "./types";

export const createMockStorage = (): StorageAdapter => ({
  async createSignedUrl({ bucket, path, expiresInS }) {
    return {
      url: `/demo/${bucket}/${encodeURIComponent(path)}`,
      expiresAt: new Date(Date.now() + expiresInS * 1000),
    };
  },
  async createUploadUrl({ bucket, path }) {
    return { url: `/demo/upload/${bucket}/${encodeURIComponent(path)}`, path };
  },
});

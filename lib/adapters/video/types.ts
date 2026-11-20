import type { Costed } from "../shared";

export interface VideoAdapter {
  /** Resumable (tus) upload target. `maxDurationS` comes from the family's entitlements. */
  createUpload(input: {
    familyId: string;
    maxDurationS: number;
  }): Promise<Costed<{ assetId: string; uploadUrl: string }>>;
  getPlayback(assetId: string): Promise<{
    assetId: string;
    status: "processing" | "ready" | "failed";
    playbackUrl: string | null;
  }>;
}

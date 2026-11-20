import type { VideoAdapter } from "./types";

export const createMockVideo = (): VideoAdapter => ({
  async createUpload({ familyId }) {
    const assetId = `demo-video-${familyId.slice(0, 8)}`;
    return { assetId, uploadUrl: `/demo/upload/video/${assetId}`, costCents: 0 };
  },
  async getPlayback(assetId) {
    return { assetId, status: "ready", playbackUrl: `/demo/video/${assetId}.m3u8` };
  },
});

import { Image, loadImage } from "@napi-rs/canvas";

export function loadImages(urls: string[]) {
  return urls.reduce(async (acc: { [key: string]: any }, cur) => {
    return {
      ...acc,
      ...(!acc[cur] ? { [cur]: await loadImage(cur) } : {}),
    };
  }, {});
}

const memCache: Record<string, any> = {};

export async function loadAndCacheImage(
  imageUrl: string,
): Promise<Image | null> {
  if (!imageUrl) return null;
  if (memCache[imageUrl]) {
    return memCache[imageUrl];
  }

  try {
    const img = await loadImage(imageUrl);
    memCache[imageUrl] = img;
    return memCache[imageUrl];
  } catch (e) {
    console.error(`[loadAndCacheImage] failed: ${e}`);
    throw e;
  }
}

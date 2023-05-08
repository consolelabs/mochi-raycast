import { Image, loadImage, SKRSContext2D } from "@napi-rs/canvas";

type LineStats = {
  from: number;
  to: number;
};

export type TextStats = {
  x: number;
  y: number;
} & PositionStats;

type PositionStats = {
  ml?: number;
  mr?: number;
  mt?: number;
  mb?: number;
  pl?: number;
  pr?: number;
  pt?: number;
  pb?: number;
};

export type RectangleStats = {
  x: LineStats;
  y: LineStats;
  w: number;
  h: number;
  radius: number;
  overlayColor?: string;
  bgColor?: string;
} & PositionStats;

export type CircleleStats = {
  x: number;
  y: number;
  radius: number;
  outlineColor?: string;
  outlineWidth?: number;
};

export function drawRectangle(
  ctx: SKRSContext2D,
  stats: RectangleStats,
  hexColor?: string,
  borderColor?: string,
) {
  const { radius, x, y } = stats;
  ctx.save();
  // --------------
  ctx.beginPath();
  ctx.lineWidth = 6;
  if (hexColor) {
    ctx.fillStyle = hexColor;
  }
  ctx.moveTo(x.from + radius, y.from);
  ctx.lineTo(x.to - radius, y.from); // top edge
  ctx.arc(x.to - radius, y.from + radius, radius, 1.5 * Math.PI, 0); // top-right corner
  ctx.lineTo(x.to, y.to - radius); // right edge
  ctx.arc(x.to - radius, y.to - radius, radius, 0, 0.5 * Math.PI); // bottom-right corner
  ctx.lineTo(x.from + radius, y.to); // bottom edge
  ctx.arc(x.from + radius, y.to - radius, radius, 0.5 * Math.PI, Math.PI); // bottom-left corner
  ctx.lineTo(x.from, y.from + radius); // left edge
  ctx.arc(x.from + radius, y.from + radius, radius, Math.PI, 1.5 * Math.PI); // top-left corner
  ctx.fill();
  if (borderColor) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }
  ctx.closePath();
  // --------------
  ctx.restore();
}

export function drawProgressBar(
  ctx: SKRSContext2D,
  pgBarContainer: RectangleStats,
  progress: number,
) {
  ctx.save();
  // --------------
  // pg bar container
  drawRectangle(ctx, pgBarContainer, "#231E2B", pgBarContainer.overlayColor);
  // pg bar overlay
  if (progress === 0) return;
  const overlay = JSON.parse(JSON.stringify(pgBarContainer)); // deep copy
  overlay.x.to = Math.max(
    overlay.x.from + overlay.radius * 2,
    overlay.x.from + overlay.w * progress,
  );
  drawRectangle(ctx, overlay, pgBarContainer.overlayColor);
  // --------------
  ctx.restore();
}

export async function drawCircleImage({
  ctx,
  stats,
  imageURL,
  image,
}: {
  ctx: SKRSContext2D;
  stats: CircleleStats;
  imageURL?: string;
  image?: Image | null;
}) {
  if (!image && !imageURL) return;
  ctx.save();
  // --------------
  ctx.beginPath();
  ctx.lineWidth = stats.outlineWidth ?? 10;
  ctx.arc(stats.x, stats.y, stats.radius, 0, Math.PI * 2);
  if (stats.outlineColor) {
    ctx.strokeStyle = stats.outlineColor;
    ctx.stroke();
  }
  ctx.closePath();
  ctx.clip();

  if (!image && imageURL) {
    image = await loadImage(imageURL);
  }

  ctx.drawImage(
    image as any,
    stats.x - stats.radius,
    stats.y - stats.radius,
    stats.radius * 2,
    stats.radius * 2,
  );
  // --------------
  ctx.restore();
}

export function loadImages(urls: string[]) {
  return urls.reduce(async (acc: { [key: string]: any }, cur) => {
    return {
      ...acc,
      ...(!acc[cur] ? { [cur]: await loadImage(cur) } : {}),
    };
  }, {});
}

export async function drawRectangleAvatar(
  ctx: SKRSContext2D,
  avatar: RectangleStats,
  avatarURL: string,
) {
  ctx.save();
  // --------------
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.moveTo(avatar.x.from + avatar.radius, avatar.y.from);
  ctx.arcTo(
    avatar.x.to,
    avatar.y.from,
    avatar.x.to,
    avatar.y.from + avatar.radius,
    avatar.radius,
  );

  ctx.arcTo(
    avatar.x.to,
    avatar.y.to,
    avatar.x.to - avatar.radius,
    avatar.y.to,
    avatar.radius,
  );

  ctx.arcTo(
    avatar.x.from,
    avatar.y.to,
    avatar.x.from,
    avatar.y.to - avatar.radius,
    avatar.radius,
  );

  ctx.arcTo(
    avatar.x.from,
    avatar.y.from,
    avatar.x.from + avatar.radius,
    avatar.y.from,
    avatar.radius,
  );
  ctx.closePath();
  ctx.clip();

  if (avatarURL) {
    const userAvatar = await loadImage(avatarURL);
    ctx.drawImage(userAvatar, avatar.x.from, avatar.y.from, avatar.w, avatar.h);
  }
  // --------------
  ctx.restore();
}

export function drawDivider(
  ctx: SKRSContext2D,
  fromX: number,
  toX: number,
  y: number,
  color?: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color ?? "#918d8d";
  ctx.moveTo(fromX, y);
  ctx.lineTo(toX, y);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

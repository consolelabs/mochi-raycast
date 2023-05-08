import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

import "./chartjs-date-aldapter";
import { RectangleStats, drawCircleImage, drawRectangle } from "./canvas/draw";
import { loadAndCacheImage } from "./canvas/image";
import { formatCurrency, formatPercent } from "./string";
import { widthOf } from "./canvas/calculator";
import { ChartJSNodeCanvas } from "./chartjs-canvas";
import { getGradientColor } from "./canvas/color";

GlobalFonts.registerFromPath("assets/fonts/inter/Inter-Regular.ttf", "Inter");

export async function renderChartImage({
  chartLabel,
  labels,
  data = [],
  theme = "dark",
  size = "large",
  lineOnly = false,
  colorConfig = {},
}: {
  chartLabel?: string;
  labels?: string[];
  data: number[];
  theme: "dark" | "light";
  size: "large" | "small";
  lineOnly?: boolean;
  colorConfig?: {
    borderColor?: string;
    backgroundColor?: string;
  };
}) {
  const chartCanvas = new ChartJSNodeCanvas({ width: 660, height: 500 });
  const chartCanvasSmall = new ChartJSNodeCanvas({ width: 456, height: 200 });

  let colorCfg = {
    color: "#878CA1",
    borderColor: "rgba(96,196,136,1)",
    backgroundColor: lineOnly ? undefined : "rgba(96,196,136, 0.1)", // getGradientColor("rgba(96,196,136, 0.6)", "rgba(96,196,136, 0.08)"),
  };

  if (theme === "light") {
    colorCfg = {
      color: "#515151",
      borderColor: "rgba(96,196,136,1)",
      backgroundColor: lineOnly ? undefined : "rgba(96,196,136, 0.1)", // getGradientColor("rgba(96,196,136, 0.6)", "rgba(96,196,136, 0.08)"),
    };
  }

  // @ts-ignore
  colorCfg = {
    ...colorCfg,
    ...colorConfig,
  };

  const axisConfig = {
    ticks: {
      font: {
        size: size === "small" ? 12 : 16,
      },
      color: colorCfg.color,
    },
    grid: {
      borderColor: colorCfg.color,
    },
  };

  return (size === "small" ? chartCanvasSmall : chartCanvas).renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: 3,
          pointRadius: 0,
          fill: true,
          ...colorCfg,
          tension: 0.2,
        },
      ],
    },
    options: {
      scales: {
        y: axisConfig as any,
        x: axisConfig as any,
      },
      plugins: {
        legend: {
          display: size !== "small",
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: size === "small" ? 12 : 16,
            },
          },
        },
      },
      ...(lineOnly && {
        scales: {
          x: {
            grid: {
              display: false,
            },
            display: false,
          },
          y: {
            grid: {
              display: false,
            },
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      }),
    },
  });
}

export async function renderCompactTokenChart({
  theme,
  symbol,
  image,
  sparkline_in_7d,
  price_change_percentage_7d,
  current_price,
}: {
  theme: string;
  symbol: string;
  current_price: number;
  sparkline_in_7d: any;
  price_change_percentage_7d: number;
  image: string;
}) {
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 236,
    },
    y: {
      from: 0,
      to: 133,
    },
    w: 0,
    h: 0,
    pt: 0,
    pl: 0,
    radius: 2,
    bgColor: theme === "light" ? "#FAF4F2" : "#191919",
  };
  container.w = container.x.to - container.x.from;
  container.h = container.y.to - container.y.from;
  const canvas = createCanvas(container.w, container.h);
  const ctx = canvas.getContext("2d");
  drawRectangle(ctx, container, container.bgColor);

  const ascColor = "#56c9ac";
  const descColor = "#ed5565";

  let imageUrl = image;
  // image

  const baseImage = await loadAndCacheImage(imageUrl);

  // symbol;
  ctx.font = "bold 18px Inter";
  ctx.fillStyle = theme === "light" ? "#515151" : "white";

  const symbolText = symbol.toUpperCase();
  ctx.fillText(symbolText, 36, 26);
  if (baseImage) {
    drawCircleImage({
      ctx,
      image: baseImage,
      stats: { radius: 12, x: 20, y: 20 },
    });
  }

  // price
  ctx.font = "bold 18px Inter";
  ctx.fillStyle = theme === "light" ? "#515151" : "white";
  const currentPrice = formatCurrency(current_price);
  const priceW = widthOf(ctx as any, currentPrice);
  ctx.fillText(currentPrice, container.x.to - 10 - priceW, 26);

  // 7d change percentage
  ctx.font = "14px Inter";
  ctx.fillStyle = price_change_percentage_7d >= 0 ? ascColor : descColor;
  const change = formatPercent(price_change_percentage_7d);
  const changeW = widthOf(ctx as any, change);
  ctx.fillText(change, container.x.to - 10 - changeW, 46);

  // 7d chart
  const buffer = await renderChartImage({
    labels: sparkline_in_7d.map((p: number) => `${p}`),
    data: sparkline_in_7d,
    lineOnly: true,
    size: "small",
    theme: theme as any,
    // @ts-ignore
    colorConfig: {
      borderColor: price_change_percentage_7d >= 0 ? ascColor : descColor,
      backgroundColor:
        price_change_percentage_7d >= 0
          ? (getGradientColor(
              "rgba(86,201,172, 0.08)",
              "rgba(86,201,172, 0.02)",
            ) as any)
          : (getGradientColor(
              "rgba(237,85,101, 0.08)",
              "rgba(237,85,101, 0.02)",
            ) as any),
    },
  });

  const chartImg = await loadImage(buffer);
  const chartW = container.x.to;
  const chartX = 0;
  const chartH = container.y.to - 50;
  const chartY = 50;
  ctx.drawImage(chartImg, chartX, chartY, chartW, chartH);

  return canvas.toBuffer("image/png");
}

// source: https://github.com/SeanSobey/ChartjsNodeCanvas
// modify to use @napi-rs/canvas instead of node-canvas

import { Readable } from "stream";
import {
  Chart as ChartJS,
  ChartConfiguration,
  ChartComponentLike,
} from "chart.js";
import NCanvas, {
  Canvas,
  createCanvas,
  GlobalFonts,
  Image,
} from "@napi-rs/canvas";
import { BackgroundColourPlugin } from "./bgColorPlugin";

const registerFont = GlobalFonts.registerFromPath;

export type ChartJSNodeCanvasPlugins = {
  /**
   * Global plugins, see https://www.chartjs.org/docs/latest/developers/plugins.html.
   */
  readonly modern?: ReadonlyArray<string | ChartComponentLike>;
  /**
   * This will work for plugins that `require` ChartJS themselves.
   */
  readonly requireChartJSLegacy?: ReadonlyArray<string>;
  /**
   * This should work for any plugin that expects a global Chart variable.
   */
  readonly globalVariableLegacy?: ReadonlyArray<string>;
  /**
   * This will work with plugins that just return a plugin object and do no specific loading themselves.
   */
  readonly requireLegacy?: ReadonlyArray<string>;
};

export type ChartCallback = (chartJS: typeof ChartJS) => void | Promise<void>;
export type CanvasType = "pdf" | "svg";
export type MimeType = "image/png" | "image/jpeg";

export interface ChartJSNodeCanvasOptions {
  readonly width: number;
  readonly height: number;
  readonly chartCallback?: ChartCallback;
  readonly type?: CanvasType;
  readonly plugins?: ChartJSNodeCanvasPlugins;
  readonly backgroundColour?: string;
}

export class ChartJSNodeCanvas {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _chartJs: typeof ChartJS;
  private readonly _createCanvas: typeof createCanvas;
  private readonly _image: typeof Image;

  /**
   * Create a new instance of CanvasRenderService.
   *
   * @param options Configuration for this instance
   */
  constructor(options: ChartJSNodeCanvasOptions) {
    if (options === null || typeof options !== "object") {
      throw new Error("An options parameter object is required");
    }
    if (!options.width || typeof options.width !== "number") {
      throw new Error("A width option is required");
    }
    if (!options.height || typeof options.height !== "number") {
      throw new Error("A height option is required");
    }

    this._width = options.width;
    this._height = options.height;
    this._createCanvas = NCanvas.createCanvas;
    this._image = NCanvas.Image;
    this._chartJs = this.initialize(options);
  }

  public renderToBuffer(
    configuration: ChartConfiguration,
    mimeType: MimeType = "image/png",
  ): Buffer {
    const chart = this.renderChart(configuration);
    if (!chart.canvas) {
      throw new Error("Canvas is null");
    }

    // @ts-ignore
    const canvas = chart.canvas as Canvas;

    const a = canvas.toBuffer(mimeType as any);
    chart.destroy();
    return a;
  }

  private initialize(options: ChartJSNodeCanvasOptions): typeof ChartJS {
    const chartJs: typeof ChartJS = require("chart.js");

    if (options.plugins?.modern) {
      for (const plugin of options.plugins.modern) {
        chartJs.register(plugin as any);
      }
    }

    if (options.chartCallback) {
      options.chartCallback(chartJs);
    }

    if (options.backgroundColour) {
      chartJs.register(
        new BackgroundColourPlugin(
          options.width,
          options.height,
          options.backgroundColour,
        ),
      );
    }

    delete require.cache[require.resolve("chart.js")];

    return chartJs;
  }

  private renderChart(configuration: ChartConfiguration): ChartJS {
    const canvas = this._createCanvas(this._width, this._height);
    configuration.options = configuration.options || {};
    configuration.options.responsive = false;
    configuration.options.animation = false as any;
    const context = canvas.getContext("2d");
    const chart = new this._chartJs(context as any, configuration);
    delete (global as any).Image;
    return chart;
  }
}

import axios from "axios";
import useSWR from "swr";
import { useEffect, useRef } from "react";
import Head from "next/head";
import { formatCurrency, formatPercent } from "@/utils/string";
const ignoredSymbols: Record<string, boolean> = {
  busd: true,
  tusd: true,
  usdc: true,
  usdt: true,
  dai: true,
  frax: true,
};

export default function Page() {
  const element = useRef(null);
  const refTree = useRef<any>(null);
  const { data: markdown } = useSWR("/api/heatmap", async () => {
    const {
      data: { data },
    } = await axios.get("https://api.mochi.pod.town/api/v1/defi/market-data");
    const resp = data.filter(
      (d: Record<string, any>) => !ignoredSymbols[d?.symbol],
    );

    const totalMarketCap = resp.reduce(
      (acc: any, cur: any) => acc + cur.market_cap,
      0,
    );
    return resp.map((item: any) => ({
      ...item,
      label: `${item.name}\n${formatCurrency(
        item.current_price,
      )}\n${formatPercent(item.price_change_percentage_24h)}`,
      weight: item.market_cap / totalMarketCap,
    }));
  });

  useEffect(() => {
    if (!markdown) return;

    import("@carrotsearch/foamtree").then(({ default: FoamTree }) => {
      const foamTree = new FoamTree({
        element: element.current,
        layour: "relaxed",
        id: "tree",
        pixelRatio: window.devicePixelRatio || 1,

        // Use rectangular layout by default
        layout: "squarified",
        relaxationQualityThreshold: 2.5,

        // Use flattened view by default
        stacking: "flattened",
        descriptionGroupSize: 0.0,
        descriptionGroupMinHeight: 18,

        // Disable animations
        fadeDuration: 500,
        rolloutDuration: 0,
        pullbackDuration: 0,

        // Customize borders, fill and strokes
        groupBorderWidth: 2,
        groupInsetWidth: 4,
        groupBorderRadius: 0.1,
        groupBorderRadiusCorrection: 1,
        groupSelectionOutlineWidth: 3,
        groupSelectionOutlineColor: "#969FAD",

        groupFillType: "plain",
        groupFillGradientRadius: 3,
        groupFillGradientCenterLightnessShift: 20,

        groupStrokeWidth: 0.33,
        groupStrokeType: "plain",
        groupStrokePlainLightnessShift: 0,

        groupUnexposureSaturationShift: -100,
        groupUnexposureLightnessShift: 200,

        // Allow some more time to draw
        finalCompleteDrawMaxDuration: 1000,
        finalIncrementalDrawMaxDuration: 1000,

        dataObject: {
          groups: markdown,
        },

        groupColorDecorator: function (opts: any, params: any, vars: any) {
          if (params.group.price_change_percentage_24h > 0) {
            vars.groupColor = {
              r: 96,
              g: 196,
              b: 136,
              a: 1,
              model: "rgba",
            };
          } else {
            vars.groupColor = {
              r: 181,
              g: 45,
              b: 41,
              a: 1,
              model: "rgba",
            };
          }
        },
      });
      refTree.current = foamTree;

      // foamTree.set({
      //   descriptionGroupSize: 0.0,
      //   descriptionGroupMinHeight: 18,
      //   layout: "squarified",
      // });
    });

    return () => {
      if (refTree.current) refTree.current?.dispose();
    };
  }, [markdown]);

  return (
    <>
      <Head>
        <title>Heatmap Coin Market | Mochi </title>
      </Head>
      <div
        style={{ height: "100vh", width: "100vw" }}
        id="tree"
        ref={element}
      />
    </>
  );
}

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { renderCompactTokenChart } from "@/utils/render-chart";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import _ from "lodash";
import dayjs from "dayjs";

type Data = any;

import { LRUCache } from "lru-cache";

const memCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5,
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// @ts-ignore
async function fetcherTicker(
  token: string,
  interval: string,
  currency: string = "usd",
) {
  const {
    data: { data },
  } = await axios.get(
    `https://api.mochi.pod.town/api/v1/defi/coins/compare?base=${token}&interval=${interval}&target=${currency}`,
  );

  if (data.base_coin_suggestions) {
    return fetcherTicker(data.base_coin_suggestions[0].id, interval, currency);
  }
  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  try {
    const { token, theme } = req.query;
    const key = `${token}-${dayjs().format("YYYY-MM-DD-HH-mm")}-${theme}`;
    if (!memCache.get(key)) {
      const tokenData = await fetcherTicker(token as string, "7", "usd");
      const img = await renderCompactTokenChart({
        // @ts-ignore
        theme,
        sparkline_in_7d: tokenData.ratios,
        price_change_percentage_7d:
          tokenData.base_coin.market_data.price_change_percentage_7d_in_currency
            .usd,
        current_price: tokenData.base_coin.market_data.current_price.usd,
        symbol: tokenData.base_coin.symbol,
        image: tokenData.base_coin.image?.small,
      });
      memCache.set(key, img);
    }

    res
      .writeHead(200, {
        "content-type": "image/png",
        "Content-Length": (memCache.get(key) as Buffer)?.length! || 0,
      })
      .end(memCache.get(key));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

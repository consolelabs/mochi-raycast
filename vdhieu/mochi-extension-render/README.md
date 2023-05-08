# Mochi extension render

A chart render for mochi extention

![img](/docs/mochi-render.png)

### Technologies

- `NextJS` easy way to build deploy serverless functions
- `chart.js`, `@napi-rs/canvas` and modified version of `chartjs-node-canvas` to render chart in node
- `lru-cache` short term in memory caching tokens data and rendered charts

### Available API

- **Ticker**: return token chart and details market data

```
curl /api/ticker?token=btc&time_step=7&theme=light&size=large
```

- **Ticker compact**: render token chart in compact view

```
curl /api/ticker?token=btc&theme=light
```

### Mochi API

List of mochi API being used

- Get token data: https://api.mochi.pod.town/api/v1/defi/coins/compare

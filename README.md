# national-statistics-site

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/ngadukun/national-statistics-site/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/ngadukun/national-statistics-site/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

Statistik Indonesia — a national statistics dashboard for Indonesia, built with published BPS (Statistics Indonesia) figures for 2019–2024. Population, GDP growth, inflation, unemployment, poverty, provinces and more, with hand-drawn interactive charts. A static site: no build step, no network requests, works offline from its own files on desktop and on a phone.

## Run it

```sh
node main.ts
```

That writes `out/` (a copy of `app/` and `screenshots/`, plus `out/dossier.json` built with the kit's dossier library). Then open `out/app/index.html` in a browser — or open `app/index.html` directly; the site needs no server.

## What is inside

- `app/index.html` — the site: Overview, Economy, People, Provinces, Sources & methods.
- `app/style.css` — all styling, light + dark theme, responsive down to small phones.
- `app/app.js` — the data (embedded, no fetch) and the charts and controls: indicator tabs, year range, year-in-focus selector, sortable/searchable province table, theme toggle. Every control works.
- `main.ts` — the Node 22 entrypoint: copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.
- `vendor/makefun-frontend.ts` — make.fun's dossier library, copied from the kit unchanged.
- `screenshots/` — 4 real renders of the running site, one at phone size.

## Data

All headline figures are published aggregates from BPS — Statistics Indonesia (GDP, prices, Sakernas labour survey, poverty, census, HDI, Gini), plus the Bank Indonesia policy rate. Values marked "approx." are rounded or estimated from published aggregates. Reference years are shown beside every figure, and the Sources & methods section on the site explains each series.

---

<sub>Entered on [make.fun](https://make.fun/?ref=76a09jb0&utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539) · AI agents build software for cash rewards</sub>

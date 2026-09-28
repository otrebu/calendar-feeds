# Calendar Feeds

This project builds an ICS calendar via a TypeScript CLI and publishes the file via GitHub Actions.

Each provider generates its own calendar file named `<provider>.ics` by default.
The `tides` provider now computes Jersey tide extremes locally using harmonic
constituents derived from the public-domain NASA/NOAA HRET14 dataset. The
constituents are evaluated with the `@neaps/tide-predictor` library, ensuring
four tide events per day without calling an external API. Heights are produced
relative to the local chart datum, matching the tide tables at
[gov.je](https://www.gov.je/weather/tidetimes/).

Run `node dist/cli.js --provider tides` to generate the file. Add the `--nuke`
option to ignore any existing calendar and recreate it from scratch (the GitHub
workflow uses this by default).

Subscribe to the latest feed:

```
https://raw.githubusercontent.com/<user>/<repo>/main/tides.ics
```

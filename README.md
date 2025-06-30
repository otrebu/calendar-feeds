# Calendar Feeds

This project builds an ICS calendar via a TypeScript CLI and publishes the file via GitHub Actions.

Each provider generates its own calendar file named `<provider>.ics` by default.
The `tides` provider fetches tide extremes from the Storm Glass API and aligns
results to full local days so you get all four tide times for each day similar
to the jersey tide table at [gov.je](https://www.gov.je/weather/tidetimes/).
By default, Storm Glass returns tide heights relative to Mean Sea Level (MSL).
You can request a different datum (for example `MLLW` or `LAT`) by passing the
`datum` parameter. The provider reads this from the `STORM_DATUM` environment
variable and includes it in the API call when set.
Subscribe to the latest feed:

```
https://raw.githubusercontent.com/<user>/<repo>/main/tides.ics
```

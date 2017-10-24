# Simon-Ehrlich Wager

A visualization of the price data used to settle the [Simon-Ehrlich wager][wager].

## Data
The price data for the five metals used in the wager comes from the [United States Geological Survey][data].

To update the data, simply replace metals.tsv with an updated file. One column must be named `Year`, all other columns will be pivoted so that their column title ends up as a `type` property, and the value of that column becomes the value for a `price` property.

You'll need to have [d3-dsv][dsv] and [ndjson-cli][ndjson] installed.

To generate a new JSON file simply run
```
$ yarn run prepare
```

## Set up

### Prerequisites

- [Node][node]
- [Yarn][yarn]

### Building
```
$ yarn
$ yarn run dist
```

### Development Server
```
$ yarn start
$ open http://localhost:8000
```

### Clean up
```
$ yarn run clean
```

[wager]: https://en.wikipedia.org/wiki/Simon–Ehrlich_wager
[node]: https://nodejs.org/en/
[yarn]: https://yarnpkg.com/en/
[data]: https://minerals.usgs.gov/minerals/pubs/historical-statistics/
[dsv]: https://github.com/d3/d3-dsv
[ndjson]: https://github.com/mbostock/ndjson-cli

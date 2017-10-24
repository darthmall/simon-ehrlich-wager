#!/bin/bash

tsv2json < $1 |
  ndjson-split |
  ndjson-map 'Object.keys(d).map(k => [k, d[k]])' |
  ndjson-map 'd.slice(1).map((m, i, a) => { return {year: +d[0][1], type: m[0], price: +m[1]} })' |
  ndjson-reduce 'p.concat(d)' > $2
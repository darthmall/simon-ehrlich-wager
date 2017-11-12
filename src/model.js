import {nest} from "d3-collection";

/**
 * Return price-normalized data for each material in priceData over specified
 * period.
 */
export function simonEhrlichWager(priceData,
  startYear=1980,
  endYear=1990,
  initialValue=1000) {
  
  const periodData = priceData.filter(d => (
    d.year >= startYear &&
    d.year <= endYear
  ));
    
  const materialPrices = nest()
    .key(d => d.type)
    .sortValues((a, b) => a.year - b.year)
    .entries(periodData);
    
  const initialMaterialValue = initialValue / materialPrices.length;
  
  const initialAmounts = new Map(materialPrices.map(e => {
    return [e.key, initialMaterialValue / e.values[0].price];
  }));
  
  return periodData.map(d => {
    const amount = initialAmounts.get(d.type) || 0;
    return Object.assign({ amount, value: d.price * amount}, d);
  });
}
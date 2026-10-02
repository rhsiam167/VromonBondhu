/**
 * Interest priority weights.
 *
 * Formula (from the project spec):
 *     weight = (N - rank + 1) / N
 * where N is how many interests were selected and rank starts at 1.
 *
 * Example with 4 interests: rank 1 → 1.00, rank 2 → 0.75, rank 3 → 0.50, rank 4 → 0.25
 */
export function calculateWeight(rank, totalSelected) {
  if (totalSelected === 0) return 0;
  return (totalSelected - rank + 1) / totalSelected;
}

/** ['beach','nature'] → { beach: 1, nature: 0.5 } */
export function getInterestWeights(rankedInterestIds) {
  const total = rankedInterestIds.length;
  const weights = {};
  rankedInterestIds.forEach((id, index) => {
    weights[id] = calculateWeight(index + 1, total);
  });
  return weights;
}

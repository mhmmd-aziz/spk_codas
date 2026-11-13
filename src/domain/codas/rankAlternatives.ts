import { TIE_TOLERANCE } from "./preset";
import type { Alternative, RankedAlternative } from "./types";

/**
 * Step 8 of CODAS: sort alternatives by descending assessment score H_i.
 * Compares full unrounded floating-point values. Values within `tieTolerance`
 * receive the same competition rank (matching Excel RANK.EQ) so no artificial
 * difference is implied, while preserving original input order within a tie group.
 */
export function rankAlternatives(
  alternatives: Alternative[],
  assessmentScores: number[],
  euclideanDistances: number[],
  taxicabDistances: number[],
  tieTolerance: number = TIE_TOLERANCE,
): RankedAlternative[] {
  const indexed = alternatives.map((alt, idx) => ({
    index: idx,
    alternativeId: alt.id,
    score: assessmentScores[idx] ?? 0,
    euclidean: euclideanDistances[idx] ?? 0,
    taxicab: taxicabDistances[idx] ?? 0,
  }));

  indexed.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) <= tieTolerance) {
      return a.index - b.index;
    }
    return diff > 0 ? 1 : -1;
  });

  const ranks: number[] = Array<number>(indexed.length).fill(1);
  const groupSizes: number[] = Array<number>(indexed.length).fill(1);

  let i = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (
      j < indexed.length &&
      Math.abs(indexed[j].score - indexed[i].score) <= tieTolerance
    ) {
      j++;
    }
    const groupSize = j - i;
    const rank = i + 1;
    for (let k = i; k < j; k++) {
      ranks[k] = rank;
      groupSizes[k] = groupSize;
    }
    i = j;
  }

  return indexed.map((item, pos) => ({
    alternativeId: item.alternativeId,
    score: item.score,
    rank: ranks[pos],
    tieGroupSize: groupSizes[pos],
    euclidean: item.euclidean,
    taxicab: item.taxicab,
  }));
}


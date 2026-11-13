import { normalizeDecisionMatrix } from "./normalize";
import { TIE_TOLERANCE } from "./preset";
import { rankAlternatives } from "./rankAlternatives";
import type {
  CodasModel,
  CodasResult,
  DistanceBreakdown,
  RelativePairDetail,
  ValidationResult,
} from "./types";
import { validateModel } from "./validateModel";

export interface CodasEvaluation {
  validation: ValidationResult;
  result: CodasResult | null;
}

/**
 * Pure CODAS math pipeline (Steps 1-8) with zero intermediate rounding.
 * Assumes structural dimensions are valid; callers in UI/export should use
 * `calculateCodas` so validation errors prevent invalid calculations.
 */
export function computeCodasRaw(model: CodasModel): CodasResult {
  const { alternatives, criteria, tau } = model;
  const n = alternatives.length;
  const m = criteria.length;

  // Step 1 & 2: Decision matrix and normalized matrix
  const { decisionMatrix, normalizedMatrix, columnStats, notices } =
    normalizeDecisionMatrix(alternatives, criteria);

  // Step 3: Weighted normalized decision matrix (r_ij = w_j * n_ij)
  const weightedNormalizedMatrix: number[][] = normalizedMatrix.map((row) =>
    row.map((nIj, j) => criteria[j].weight * nIj),
  );

  // Step 4: Negative-ideal solution vector (ns_j = min_i r_ij)
  const negativeIdeal: number[] = criteria.map((_, j) => {
    if (n === 0) return 0;
    let minVal = weightedNormalizedMatrix[0][j];
    for (let i = 1; i < n; i++) {
      if (weightedNormalizedMatrix[i][j] < minVal) {
        minVal = weightedNormalizedMatrix[i][j];
      }
    }
    return minVal;
  });

  // Step 5: Euclidean (E_i) and Taxicab (T_i) distances from negative-ideal solution
  const distanceBreakdowns: DistanceBreakdown[] = [];
  const euclideanDistances: number[] = [];
  const taxicabDistances: number[] = [];

  for (let i = 0; i < n; i++) {
    const perCriterionDiff: number[] = [];
    const perCriterionSquaredDiff: number[] = [];
    const perCriterionAbsDiff: number[] = [];
    let sumSq = 0;
    let sumAbs = 0;

    for (let j = 0; j < m; j++) {
      const diff = weightedNormalizedMatrix[i][j] - negativeIdeal[j];
      const sq = diff * diff;
      const abs = Math.abs(diff);
      perCriterionDiff.push(diff);
      perCriterionSquaredDiff.push(sq);
      perCriterionAbsDiff.push(abs);
      sumSq += sq;
      sumAbs += abs;
    }

    const euclidean = Math.sqrt(sumSq);
    const taxicab = sumAbs;
    euclideanDistances.push(euclidean);
    taxicabDistances.push(taxicab);
    distanceBreakdowns.push({
      alternativeId: alternatives[i].id,
      perCriterionDiff,
      perCriterionSquaredDiff,
      perCriterionAbsDiff,
      euclidean,
      taxicab,
    });
  }

  // Step 6: Relative assessment matrix h_ik
  // h_ik = (E_i - E_k) + psi(E_i - E_k) * (T_i - T_k)
  // psi(x) = 1 if |x| >= tau, else 0
  const relativeAssessmentMatrix: number[][] = Array.from({ length: n }, () =>
    Array<number>(n).fill(0),
  );
  const relativePairs: RelativePairDetail[][] = Array.from({ length: n }, () =>
    Array<RelativePairDetail>(n),
  );

  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      const eI = euclideanDistances[i];
      const eK = euclideanDistances[k];
      const tI = taxicabDistances[i];
      const tK = taxicabDistances[k];
      const eDiff = eI - eK;
      const absEDiff = Math.abs(eDiff);
      const psi: 0 | 1 = i === k ? 0 : absEDiff >= tau ? 1 : 0;
      const tDiff = tI - tK;
      const hIk = i === k ? 0 : eDiff + psi * tDiff;

      relativeAssessmentMatrix[i][k] = hIk;
      relativePairs[i][k] = {
        i,
        k,
        alternativeIdI: alternatives[i].id,
        alternativeIdK: alternatives[k].id,
        eI,
        eK,
        eDiff,
        absEDiff,
        psi,
        tI,
        tK,
        tDiff,
        hIk,
      };
    }
  }

  // Step 7: Assessment scores H_i = sum_k h_ik
  const assessmentScores: number[] = relativeAssessmentMatrix.map((row) =>
    row.reduce((acc, val) => acc + val, 0),
  );

  // Step 8: Ranking (descending H_i)
  const ranking = rankAlternatives(
    alternatives,
    assessmentScores,
    euclideanDistances,
    taxicabDistances,
    TIE_TOLERANCE,
  );

  return {
    decisionMatrix,
    columnStats,
    normalizedMatrix,
    weightedNormalizedMatrix,
    negativeIdeal,
    distanceBreakdowns,
    euclideanDistances,
    taxicabDistances,
    relativeAssessmentMatrix,
    relativePairs,
    assessmentScores,
    ranking,
    tieTolerance: TIE_TOLERANCE,
    notices,
  };
}

/**
 * Validated CODAS evaluation entry point.
 * Returns validation errors separately and withholds calculated output when invalid.
 */
export function calculateCodas(model: CodasModel): CodasEvaluation {
  const validation = validateModel(model);
  if (!validation.valid) {
    return {
      validation,
      result: null,
    };
  }

  const result = computeCodasRaw(model);
  return {
    validation,
    result,
  };
}


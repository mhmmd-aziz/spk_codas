import type {
  Alternative,
  ColumnNormalizationStat,
  Criterion,
  ValidationIssue,
} from "./types";

export interface NormalizationOutput {
  decisionMatrix: number[][];
  normalizedMatrix: number[][];
  columnStats: ColumnNormalizationStat[];
  notices: ValidationIssue[];
}

/**
 * Step 1 & Step 2 of CODAS: build X and compute linear normalized matrix N.
 * Benefit: n_ij = x_ij / max_i(x_ij)
 * Cost:    n_ij = min_i(x_ij) / x_ij
 * Safely handles zero denominators and identical columns without returning NaN or Infinity.
 */
export function normalizeDecisionMatrix(
  alternatives: Alternative[],
  criteria: Criterion[],
): NormalizationOutput {
  const n = alternatives.length;
  const m = criteria.length;

  const decisionMatrix: number[][] = alternatives.map((alt) =>
    criteria.map((c) => {
      const val = alt.values[c.id];
      return Number.isFinite(val) ? val : 0;
    }),
  );

  const normalizedMatrix: number[][] = Array.from({ length: n }, () =>
    Array<number>(m).fill(0),
  );
  const columnStats: ColumnNormalizationStat[] = [];
  const notices: ValidationIssue[] = [];

  for (let j = 0; j < m; j++) {
    const criterion = criteria[j];
    const col = decisionMatrix.map((row) => row[j]);
    const min = n > 0 ? Math.min(...col) : 0;
    const max = n > 0 ? Math.max(...col) : 0;
    const allEqual = n > 0 && min === max;
    const allZero = n > 0 && col.every((v) => v === 0);

    columnStats.push({
      criterionId: criterion.id,
      type: criterion.type,
      min,
      max,
      allEqual,
      allZero,
    });

    if (criterion.type === "benefit") {
      if (max === 0) {
        for (let i = 0; i < n; i++) {
          normalizedMatrix[i][j] = 0;
        }
        notices.push({
          code: "BENEFIT_ZERO_MAX",
          severity: "warning",
          criterionId: criterion.id,
          messageId: `Kolom kriteria benefit ${criterion.id} memiliki maksimum 0; nilai normalisasi disetel ke 0.`,
          messageEn: `Benefit criterion ${criterion.id} has maximum 0; normalized values set to 0.`,
        });
      } else {
        for (let i = 0; i < n; i++) {
          normalizedMatrix[i][j] = allEqual ? 1 : decisionMatrix[i][j] / max;
        }
      }
    } else {
      // Cost criterion: n_ij = min_i(x_ij) / x_ij
      for (let i = 0; i < n; i++) {
        const x = decisionMatrix[i][j];
        if (x === 0) {
          normalizedMatrix[i][j] = 0;
        } else if (allEqual) {
          normalizedMatrix[i][j] = 1;
        } else {
          normalizedMatrix[i][j] = min / x;
        }
      }
    }
  }

  return {
    decisionMatrix,
    normalizedMatrix,
    columnStats,
    notices,
  };
}


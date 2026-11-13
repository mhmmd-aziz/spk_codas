export type CriterionType = "benefit" | "cost";

export type Language = "id" | "en";

export interface Criterion {
  id: string;
  nameId: string;
  nameEn: string;
  weight: number;
  type: CriterionType;
  descriptionId?: string;
  descriptionEn?: string;
}

export interface Alternative {
  id: string;
  nameId: string;
  nameEn: string;
  values: Record<string, number>;
}

export interface CodasModel {
  criteria: Criterion[];
  alternatives: Alternative[];
  tau: number;
}

export interface ValidationIssue {
  code:
    | "MIN_ALTERNATIVES"
    | "MIN_CRITERIA"
    | "DUPLICATE_CRITERION_ID"
    | "DUPLICATE_ALTERNATIVE_ID"
    | "EMPTY_CRITERION_NAME_ID"
    | "EMPTY_CRITERION_NAME_EN"
    | "DUPLICATE_CRITERION_NAME_ID"
    | "DUPLICATE_CRITERION_NAME_EN"
    | "EMPTY_ALTERNATIVE_NAME_ID"
    | "EMPTY_ALTERNATIVE_NAME_EN"
    | "DUPLICATE_ALTERNATIVE_NAME_ID"
    | "DUPLICATE_ALTERNATIVE_NAME_EN"
    | "INVALID_WEIGHT"
    | "NEGATIVE_WEIGHT"
    | "WEIGHT_SUM_MISMATCH"
    | "INVALID_TAU"
    | "NEGATIVE_TAU"
    | "TAU_OUTSIDE_RECOMMENDED_RANGE"
    | "MISSING_DECISION_VALUE"
    | "INVALID_DECISION_VALUE"
    | "COST_NON_POSITIVE_VALUE"
    | "BENEFIT_ZERO_MAX"
    | "ALL_EQUAL_COLUMN";
  severity: "error" | "warning";
  field?: string;
  criterionId?: string;
  alternativeId?: string;
  messageId: string;
  messageEn: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  totalWeight: number;
}

export interface ColumnNormalizationStat {
  criterionId: string;
  type: CriterionType;
  min: number;
  max: number;
  allEqual: boolean;
  allZero: boolean;
}

export interface DistanceBreakdown {
  alternativeId: string;
  perCriterionDiff: number[];
  perCriterionSquaredDiff: number[];
  perCriterionAbsDiff: number[];
  euclidean: number;
  taxicab: number;
}

export interface RelativePairDetail {
  i: number;
  k: number;
  alternativeIdI: string;
  alternativeIdK: string;
  eI: number;
  eK: number;
  eDiff: number;
  absEDiff: number;
  psi: 0 | 1;
  tI: number;
  tK: number;
  tDiff: number;
  hIk: number;
}

export interface RankedAlternative {
  alternativeId: string;
  score: number;
  rank: number;
  tieGroupSize: number;
  euclidean: number;
  taxicab: number;
}

export interface CodasResult {
  decisionMatrix: number[][];
  columnStats: ColumnNormalizationStat[];
  normalizedMatrix: number[][];
  weightedNormalizedMatrix: number[][];
  negativeIdeal: number[];
  distanceBreakdowns: DistanceBreakdown[];
  euclideanDistances: number[];
  taxicabDistances: number[];
  relativeAssessmentMatrix: number[][];
  relativePairs: RelativePairDetail[][];
  assessmentScores: number[];
  ranking: RankedAlternative[];
  tieTolerance: number;
  notices: ValidationIssue[];
}


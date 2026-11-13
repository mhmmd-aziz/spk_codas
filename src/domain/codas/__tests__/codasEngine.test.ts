import { describe, expect, it } from "vitest";
import { calculateCodas, computeCodasRaw } from "../calculateCodas";
import { createJournalPresetModel } from "../preset";
import type { CodasModel } from "../types";

describe("CODAS calculation engine", () => {
  it("matches the Badi, Ballem, & Shetwan (2018) journal preset and ranks S1 Tripoli first", () => {
    const model = createJournalPresetModel();
    expect(model.criteria).toHaveLength(5);
    expect(model.alternatives).toHaveLength(5);
    expect(model.tau).toBe(0.02);
    expect(model.criteria.map((c) => c.weight)).toEqual([
      0.19, 0.26, 0.24, 0.17, 0.14,
    ]);
    expect(model.criteria.map((c) => c.type)).toEqual([
      "cost",
      "benefit",
      "benefit",
      "benefit",
      "cost",
    ]);

    const { validation, result } = calculateCodas(model);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.totalWeight).toBeCloseTo(1, 10);
    expect(result).not.toBeNull();
    if (!result) return;

    // Verify Step 2 normalization for S1 (8, 8, 10, 9, 5)
    // C1 cost min=8 => 8/8=1; C2 ben max=9 => 8/9; C3 ben max=10 => 10/10=1; C4 ben max=9 => 1; C5 cost min=4 => 4/5=0.8
    expect(result.normalizedMatrix[0][0]).toBeCloseTo(1, 10);
    expect(result.normalizedMatrix[0][1]).toBeCloseTo(8 / 9, 10);
    expect(result.normalizedMatrix[0][2]).toBeCloseTo(1, 10);
    expect(result.normalizedMatrix[0][3]).toBeCloseTo(1, 10);
    expect(result.normalizedMatrix[0][4]).toBeCloseTo(0.8, 10);

    // Verify Negative-Ideal vector NS
    expect(result.negativeIdeal[0]).toBeCloseTo((8 / 9) * 0.19, 10);
    expect(result.negativeIdeal[1]).toBeCloseTo((8 / 9) * 0.26, 10);
    expect(result.negativeIdeal[2]).toBeCloseTo(0.7 * 0.24, 10);
    expect(result.negativeIdeal[3]).toBeCloseTo((7 / 9) * 0.17, 10);
    expect(result.negativeIdeal[4]).toBeCloseTo((4 / 9) * 0.14, 10);

    // Verify Euclidean & Taxicab distances
    expect(result.euclideanDistances[0]).toBeCloseTo(0.097646, 5);
    expect(result.taxicabDistances[0]).toBeCloseTo(0.180667, 5);

    // Verify diagonal of relative assessment matrix is 0
    for (let i = 0; i < 5; i++) {
      expect(result.relativeAssessmentMatrix[i][i]).toBe(0);
    }

    // Verify final ranking order matches exact mathematical computation
    expect(result.ranking.map((r) => r.alternativeId)).toEqual([
      "S1",
      "S2",
      "S5",
      "S3",
      "S4",
    ]);
    expect(result.ranking[0].rank).toBe(1);
    expect(result.ranking[0].score).toBeCloseTo(0.446347, 5);
  });

  it("handles identical nonzero columns cleanly without NaN or Infinity", () => {
    const model: CodasModel = {
      tau: 0.02,
      criteria: [
        { id: "C1", nameId: "Identik", nameEn: "Identical", weight: 0.5, type: "benefit" },
        { id: "C2", nameId: "Skor", nameEn: "Score", weight: 0.5, type: "cost" },
      ],
      alternatives: [
        { id: "A1", nameId: "Satu", nameEn: "One", values: { C1: 7, C2: 2 } },
        { id: "A2", nameId: "Dua", nameEn: "Two", values: { C1: 7, C2: 4 } },
      ],
    };

    const { validation, result } = calculateCodas(model);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some((w) => w.code === "ALL_EQUAL_COLUMN")).toBe(true);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.normalizedMatrix[0][0]).toBe(1);
    expect(result.normalizedMatrix[1][0]).toBe(1);
    expect(result.distanceBreakdowns[0].perCriterionAbsDiff[0]).toBe(0);
    expect(result.ranking[0].alternativeId).toBe("A1");
  });

  it("handles all-zero benefit column safely in raw normalization and flags warning", () => {
    const model: CodasModel = {
      tau: 0.02,
      criteria: [
        { id: "C1", nameId: "Nol", nameEn: "Zero", weight: 0.4, type: "benefit" },
        { id: "C2", nameId: "Nilai", nameEn: "Value", weight: 0.6, type: "benefit" },
      ],
      alternatives: [
        { id: "A1", nameId: "Satu", nameEn: "One", values: { C1: 0, C2: 5 } },
        { id: "A2", nameId: "Dua", nameEn: "Two", values: { C1: 0, C2: 10 } },
      ],
    };

    const { validation, result } = calculateCodas(model);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some((w) => w.code === "BENEFIT_ZERO_MAX")).toBe(true);
    expect(result?.normalizedMatrix[0][0]).toBe(0);
    expect(result?.normalizedMatrix[1][0]).toBe(0);
    expect(Number.isFinite(result?.assessmentScores[0])).toBe(true);
  });

  it("rejects zero values on cost criteria in validation and prevents NaN in raw computation", () => {
    const model: CodasModel = {
      tau: 0.02,
      criteria: [
        { id: "C1", nameId: "Biaya", nameEn: "Cost", weight: 1, type: "cost" },
      ],
      alternatives: [
        { id: "A1", nameId: "Satu", nameEn: "One", values: { C1: 0 } },
        { id: "A2", nameId: "Dua", nameEn: "Two", values: { C1: 5 } },
      ],
    };

    const { validation, result } = calculateCodas(model);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.code === "COST_NON_POSITIVE_VALUE")).toBe(true);
    expect(result).toBeNull();

    // Direct raw call never produces NaN or Infinity
    const raw = computeCodasRaw(model);
    expect(Number.isFinite(raw.normalizedMatrix[0][0])).toBe(true);
    expect(Number.isFinite(raw.assessmentScores[0])).toBe(true);
  });

  it("rejects invalid weight sums and negative weights", () => {
    const model = createJournalPresetModel();
    model.criteria[0].weight = 0.5;
    const evalMismatch = calculateCodas(model);
    expect(evalMismatch.validation.valid).toBe(false);
    expect(
      evalMismatch.validation.errors.some((e) => e.code === "WEIGHT_SUM_MISMATCH"),
    ).toBe(true);
    expect(evalMismatch.result).toBeNull();

    model.criteria[0].weight = -0.1;
    const evalNegative = calculateCodas(model);
    expect(evalNegative.validation.valid).toBe(false);
    expect(
      evalNegative.validation.errors.some((e) => e.code === "NEGATIVE_WEIGHT"),
    ).toBe(true);
  });

  it("assigns equal competition ranks when alternatives have equal scores", () => {
    const model: CodasModel = {
      tau: 0.02,
      criteria: [
        { id: "C1", nameId: "Mutu", nameEn: "Quality", weight: 1, type: "benefit" },
      ],
      alternatives: [
        { id: "A1", nameId: "Satu", nameEn: "One", values: { C1: 10 } },
        { id: "A2", nameId: "Dua", nameEn: "Two", values: { C1: 10 } },
        { id: "A3", nameId: "Tiga", nameEn: "Three", values: { C1: 5 } },
      ],
    };

    const { result } = calculateCodas(model);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.ranking.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(result.ranking[0].tieGroupSize).toBe(2);
    expect(result.ranking[2].tieGroupSize).toBe(1);
  });

  it("respects tau threshold boundary exactly (|E_i - E_k| >= tau activates psi = 1)", () => {
    const model: CodasModel = {
      tau: 0.25,
      criteria: [
        { id: "C1", nameId: "K1", nameEn: "C1", weight: 0.5, type: "benefit" },
        { id: "C2", nameId: "K2", nameEn: "C2", weight: 0.5, type: "benefit" },
      ],
      alternatives: [
        { id: "A1", nameId: "Satu", nameEn: "One", values: { C1: 10, C2: 10 } },
        { id: "A2", nameId: "Dua", nameEn: "Two", values: { C1: 5, C2: 5 } },
      ],
    };

    const baseline = calculateCodas(model).result!;
    const eDiff = Math.abs(
      baseline.euclideanDistances[0] - baseline.euclideanDistances[1],
    );

    // At tau === eDiff, psi should be 1
    model.tau = eDiff;
    const atBoundary = calculateCodas(model).result!;
    expect(atBoundary.relativePairs[0][1].psi).toBe(1);

    // Just above eDiff, psi should be 0
    model.tau = eDiff + 1e-6;
    const aboveBoundary = calculateCodas(model).result!;
    expect(aboveBoundary.relativePairs[0][1].psi).toBe(0);
  });
});

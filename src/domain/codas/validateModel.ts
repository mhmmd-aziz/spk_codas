import {
  RECOMMENDED_TAU_MAX,
  RECOMMENDED_TAU_MIN,
  WEIGHT_SUM_TOLERANCE,
} from "./preset";
import type { CodasModel, ValidationIssue, ValidationResult } from "./types";

export function validateModel(
  model: CodasModel,
  weightTolerance: number = WEIGHT_SUM_TOLERANCE,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (model.alternatives.length < 2) {
    errors.push({
      code: "MIN_ALTERNATIVES",
      severity: "error",
      field: "alternatives",
      messageId: "Model harus memiliki minimal 2 alternatif.",
      messageEn: "The model must contain at least 2 alternatives.",
    });
  }

  if (model.criteria.length < 1) {
    errors.push({
      code: "MIN_CRITERIA",
      severity: "error",
      field: "criteria",
      messageId: "Model harus memiliki minimal 1 kriteria.",
      messageEn: "The model must contain at least 1 criterion.",
    });
  }

  // Tau validation
  if (typeof model.tau !== "number" || !Number.isFinite(model.tau)) {
    errors.push({
      code: "INVALID_TAU",
      severity: "error",
      field: "tau",
      messageId: "Parameter ambang (tau) harus berupa angka yang valid.",
      messageEn: "Threshold parameter (tau) must be a valid finite number.",
    });
  } else if (model.tau < 0) {
    errors.push({
      code: "NEGATIVE_TAU",
      severity: "error",
      field: "tau",
      messageId: "Parameter ambang (tau) tidak boleh negatif.",
      messageEn: "Threshold parameter (tau) cannot be negative.",
    });
  } else if (model.tau < RECOMMENDED_TAU_MIN || model.tau > RECOMMENDED_TAU_MAX) {
    warnings.push({
      code: "TAU_OUTSIDE_RECOMMENDED_RANGE",
      severity: "warning",
      field: "tau",
      messageId: `Nilai tau (${model.tau}) berada di luar rentang anjuran jurnal (${RECOMMENDED_TAU_MIN}-${RECOMMENDED_TAU_MAX}). Perhitungan tetap dilanjutkan.`,
      messageEn: `Threshold tau (${model.tau}) is outside the paper's recommended range (${RECOMMENDED_TAU_MIN}-${RECOMMENDED_TAU_MAX}). Calculation proceeds normally.`,
    });
  }

  // Criteria validation
  const seenCriterionIds = new Set<string>();
  const seenCriterionNamesId = new Map<string, string>();
  const seenCriterionNamesEn = new Map<string, string>();
  let totalWeight = 0;

  for (const c of model.criteria) {
    if (!c.id || seenCriterionIds.has(c.id)) {
      errors.push({
        code: "DUPLICATE_CRITERION_ID",
        severity: "error",
        criterionId: c.id,
        field: "id",
        messageId: `ID kriteria "${c.id}" duplikat atau kosong.`,
        messageEn: `Criterion ID "${c.id}" is duplicated or empty.`,
      });
    }
    seenCriterionIds.add(c.id);

    const trimmedId = c.nameId.trim();
    const trimmedEn = c.nameEn.trim();

    if (!trimmedId) {
      errors.push({
        code: "EMPTY_CRITERION_NAME_ID",
        severity: "error",
        criterionId: c.id,
        field: "nameId",
        messageId: `Nama kriteria Bahasa Indonesia untuk ${c.id} wajib diisi.`,
        messageEn: `Indonesian name for criterion ${c.id} is required.`,
      });
    } else {
      const key = trimmedId.toLowerCase();
      if (seenCriterionNamesId.has(key)) {
        errors.push({
          code: "DUPLICATE_CRITERION_NAME_ID",
          severity: "error",
          criterionId: c.id,
          field: "nameId",
          messageId: `Nama kriteria "${trimmedId}" (ID) digunakan lebih dari satu kali.`,
          messageEn: `Criterion Indonesian name "${trimmedId}" is duplicated.`,
        });
      } else {
        seenCriterionNamesId.set(key, c.id);
      }
    }

    if (!trimmedEn) {
      errors.push({
        code: "EMPTY_CRITERION_NAME_EN",
        severity: "error",
        criterionId: c.id,
        field: "nameEn",
        messageId: `Nama kriteria Bahasa Inggris untuk ${c.id} wajib diisi.`,
        messageEn: `English name for criterion ${c.id} is required.`,
      });
    } else {
      const key = trimmedEn.toLowerCase();
      if (seenCriterionNamesEn.has(key)) {
        errors.push({
          code: "DUPLICATE_CRITERION_NAME_EN",
          severity: "error",
          criterionId: c.id,
          field: "nameEn",
          messageId: `Nama kriteria "${trimmedEn}" (EN) digunakan lebih dari satu kali.`,
          messageEn: `Criterion English name "${trimmedEn}" is duplicated.`,
        });
      } else {
        seenCriterionNamesEn.set(key, c.id);
      }
    }

    if (typeof c.weight !== "number" || !Number.isFinite(c.weight)) {
      errors.push({
        code: "INVALID_WEIGHT",
        severity: "error",
        criterionId: c.id,
        field: "weight",
        messageId: `Bobot untuk kriteria ${c.id} harus berupa angka valid.`,
        messageEn: `Weight for criterion ${c.id} must be a valid finite number.`,
      });
    } else if (c.weight < 0) {
      errors.push({
        code: "NEGATIVE_WEIGHT",
        severity: "error",
        criterionId: c.id,
        field: "weight",
        messageId: `Bobot untuk kriteria ${c.id} tidak boleh negatif.`,
        messageEn: `Weight for criterion ${c.id} cannot be negative.`,
      });
      totalWeight += c.weight;
    } else {
      totalWeight += c.weight;
    }
  }

  if (model.criteria.length > 0 && Math.abs(totalWeight - 1) > weightTolerance) {
    errors.push({
      code: "WEIGHT_SUM_MISMATCH",
      severity: "error",
      field: "weights",
      messageId: `Total bobot saat ini adalah ${totalWeight.toFixed(4)}. Total bobot harus sama dengan 1.0000.`,
      messageEn: `Current total weight is ${totalWeight.toFixed(4)}. Total weight must equal 1.0000.`,
    });
  }

  // Alternatives validation
  const seenAltIds = new Set<string>();
  const seenAltNamesId = new Map<string, string>();
  const seenAltNamesEn = new Map<string, string>();

  for (const alt of model.alternatives) {
    if (!alt.id || seenAltIds.has(alt.id)) {
      errors.push({
        code: "DUPLICATE_ALTERNATIVE_ID",
        severity: "error",
        alternativeId: alt.id,
        field: "id",
        messageId: `ID alternatif "${alt.id}" duplikat atau kosong.`,
        messageEn: `Alternative ID "${alt.id}" is duplicated or empty.`,
      });
    }
    seenAltIds.add(alt.id);

    const trimmedId = alt.nameId.trim();
    const trimmedEn = alt.nameEn.trim();

    if (!trimmedId) {
      errors.push({
        code: "EMPTY_ALTERNATIVE_NAME_ID",
        severity: "error",
        alternativeId: alt.id,
        field: "nameId",
        messageId: `Nama alternatif Bahasa Indonesia untuk ${alt.id} wajib diisi.`,
        messageEn: `Indonesian name for alternative ${alt.id} is required.`,
      });
    } else {
      const key = trimmedId.toLowerCase();
      if (seenAltNamesId.has(key)) {
        errors.push({
          code: "DUPLICATE_ALTERNATIVE_NAME_ID",
          severity: "error",
          alternativeId: alt.id,
          field: "nameId",
          messageId: `Nama alternatif "${trimmedId}" (ID) digunakan lebih dari satu kali.`,
          messageEn: `Alternative Indonesian name "${trimmedId}" is duplicated.`,
        });
      } else {
        seenAltNamesId.set(key, alt.id);
      }
    }

    if (!trimmedEn) {
      errors.push({
        code: "EMPTY_ALTERNATIVE_NAME_EN",
        severity: "error",
        alternativeId: alt.id,
        field: "nameEn",
        messageId: `Nama alternatif Bahasa Inggris untuk ${alt.id} wajib diisi.`,
        messageEn: `English name for alternative ${alt.id} is required.`,
      });
    } else {
      const key = trimmedEn.toLowerCase();
      if (seenAltNamesEn.has(key)) {
        errors.push({
          code: "DUPLICATE_ALTERNATIVE_NAME_EN",
          severity: "error",
          alternativeId: alt.id,
          field: "nameEn",
          messageId: `Nama alternatif "${trimmedEn}" (EN) digunakan lebih dari satu kali.`,
          messageEn: `Alternative English name "${trimmedEn}" is duplicated.`,
        });
      } else {
        seenAltNamesEn.set(key, alt.id);
      }
    }

    // Decision matrix values
    for (const c of model.criteria) {
      const hasValue = Object.prototype.hasOwnProperty.call(alt.values, c.id);
      const val = alt.values[c.id];
      if (!hasValue || val === undefined || val === null) {
        errors.push({
          code: "MISSING_DECISION_VALUE",
          severity: "error",
          alternativeId: alt.id,
          criterionId: c.id,
          field: `values.${c.id}`,
          messageId: `Nilai untuk ${alt.id} pada ${c.id} belum diisi.`,
          messageEn: `Value for ${alt.id} on ${c.id} is missing.`,
        });
      } else if (typeof val !== "number" || !Number.isFinite(val)) {
        errors.push({
          code: "INVALID_DECISION_VALUE",
          severity: "error",
          alternativeId: alt.id,
          criterionId: c.id,
          field: `values.${c.id}`,
          messageId: `Nilai untuk ${alt.id} pada ${c.id} harus berupa angka valid.`,
          messageEn: `Value for ${alt.id} on ${c.id} must be a valid finite number.`,
        });
      } else if (c.type === "cost" && val <= 0) {
        errors.push({
          code: "COST_NON_POSITIVE_VALUE",
          severity: "error",
          alternativeId: alt.id,
          criterionId: c.id,
          field: `values.${c.id}`,
          messageId: `Kriteria cost ${c.id} pada ${alt.id} harus bernilai > 0 agar rasio normalisasi (min / x_ij) terdefinisi.`,
          messageEn: `Cost criterion ${c.id} for ${alt.id} must be > 0 so cost normalization (min / x_ij) is well-defined.`,
        });
      }
    }
  }

  // Column-level advisories (for benefit zero max or identical columns)
  if (model.alternatives.length > 0 && model.criteria.length > 0) {
    for (const c of model.criteria) {
      const colVals = model.alternatives
        .map((a) => a.values[c.id])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

      if (colVals.length === model.alternatives.length) {
        const maxVal = Math.max(...colVals);
        const minVal = Math.min(...colVals);
        if (c.type === "benefit" && maxVal === 0 && minVal === 0) {
          warnings.push({
            code: "BENEFIT_ZERO_MAX",
            severity: "warning",
            criterionId: c.id,
            messageId: `Semua nilai pada kriteria benefit ${c.id} adalah 0. Normalisasi ditetapkan ke 0 untuk menghindari pembagian nol.`,
            messageEn: `All values for benefit criterion ${c.id} are 0. Normalized values default to 0 to avoid division by zero.`,
          });
        } else if (maxVal === minVal && maxVal !== 0) {
          warnings.push({
            code: "ALL_EQUAL_COLUMN",
            severity: "warning",
            criterionId: c.id,
            messageId: `Semua nilai pada kriteria ${c.id} identik (${maxVal}). Semua nilai ternormalisasi bernilai 1 dan kontribusi jarak terhadap solusi ideal negatif adalah 0.`,
            messageEn: `All values for criterion ${c.id} are identical (${maxVal}). Every normalized value is 1 and distance contribution to the negative-ideal solution is 0.`,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalWeight,
  };
}


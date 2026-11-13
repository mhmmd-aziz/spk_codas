import type { CodasModel, CodasResult, Language } from "./types";

export function formatNum(value: number, decimals: number = 4): string {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(decimals);
  // Avoid displaying "-0.0000" when value is tiny negative noise
  if (/^-0\.0+$/.test(fixed) || fixed === "-0") {
    return fixed.replace("-", "");
  }
  return fixed;
}

export const STEP_LATEX_FORMULAS: Record<number, string> = {
  1: String.raw`X = [x_{ij}]_{n \times m}`,
  2: String.raw`n_{ij} = \begin{cases} \dfrac{x_{ij}}{\max_i(x_{ij})}, & j \in N_b \text{ (Benefit)} \\[8pt] \dfrac{\min_i(x_{ij})}{x_{ij}}, & j \in N_c \text{ (Cost)} \end{cases}`,
  3: String.raw`r_{ij} = w_j \cdot n_{ij}, \qquad \sum_{j=1}^{m} w_j = 1`,
  4: String.raw`ns_j = \min_i(r_{ij}), \qquad NS = [ns_1, ns_2, \ldots, ns_m]`,
  5: String.raw`E_i = \sqrt{\sum_{j=1}^{m} (r_{ij} - ns_j)^2}, \qquad T_i = \sum_{j=1}^{m} |r_{ij} - ns_j|`,
  6: String.raw`h_{ik} = (E_i - E_k) + \psi(E_i - E_k)(T_i - T_k), \qquad \psi(x) = \begin{cases} 1, & |x| \ge \tau \\ 0, & |x| < \tau \end{cases}`,
  7: String.raw`H_i = \sum_{k=1}^{n} h_{ik}`,
  8: String.raw`\text{Rank } 1 = \arg\max_i H_i`,
};

export interface StepCellTrace {
  step: number;
  titleId: string;
  titleEn: string;
  formulaSymbolic: string;
  formulaSubstituted: string;
  formulaLatex: string;
  substitutedLatex: string;
  resultDisplay: string;
  explanationId: string;
  explanationEn: string;
}

export function getNormalizationCellTrace(
  model: CodasModel,
  result: CodasResult,
  altIdx: number,
  critIdx: number,
  decimals: number = 4,
): StepCellTrace {
  const alt = model.alternatives[altIdx];
  const crit = model.criteria[critIdx];
  const stat = result.columnStats[critIdx];
  const x = result.decisionMatrix[altIdx][critIdx];
  const nVal = result.normalizedMatrix[altIdx][critIdx];
  const i1 = altIdx + 1;
  const j1 = critIdx + 1;

  if (crit.type === "benefit") {
    return {
      step: 2,
      titleId: `Normalisasi Benefit (${alt.id}, ${crit.id})`,
      titleEn: `Benefit Normalization (${alt.id}, ${crit.id})`,
      formulaSymbolic: "n_ij = x_ij / max_i(x_ij)",
      formulaSubstituted:
        stat.max === 0
          ? "0 / 0 -> 0"
          : `${formatNum(x, 2)} / ${formatNum(stat.max, 2)} = ${formatNum(nVal, decimals)}`,
      formulaLatex: String.raw`n_{ij} = \frac{x_{ij}}{\max_i(x_{ij})}`,
      substitutedLatex:
        stat.max === 0
          ? String.raw`n_{${i1},${j1}} = 0`
          : String.raw`n_{${i1},${j1}} = \frac{${formatNum(x, 2)}}{${formatNum(stat.max, 2)}} = ${formatNum(nVal, decimals)}`,
      resultDisplay: formatNum(nVal, decimals),
      explanationId: `Kriteria ${crit.nameId} bertipe Benefit (lebih besar lebih baik), sehingga nilai ${alt.nameId} dibagi nilai maksimum kolom (${formatNum(stat.max, 2)}).`,
      explanationEn: `Criterion ${crit.nameEn} is a Benefit criterion (higher is better), so ${alt.nameEn}'s score is divided by the column maximum (${formatNum(stat.max, 2)}).`,
    };
  }

  return {
    step: 2,
    titleId: `Normalisasi Cost (${alt.id}, ${crit.id})`,
    titleEn: `Cost Normalization (${alt.id}, ${crit.id})`,
    formulaSymbolic: "n_ij = min_i(x_ij) / x_ij",
    formulaSubstituted:
      x === 0
        ? "0"
        : `${formatNum(stat.min, 2)} / ${formatNum(x, 2)} = ${formatNum(nVal, decimals)}`,
    formulaLatex: String.raw`n_{ij} = \frac{\min_i(x_{ij})}{x_{ij}}`,
    substitutedLatex:
      x === 0
        ? String.raw`n_{${i1},${j1}} = 0`
        : String.raw`n_{${i1},${j1}} = \frac{${formatNum(stat.min, 2)}}{${formatNum(x, 2)}} = ${formatNum(nVal, decimals)}`,
    resultDisplay: formatNum(nVal, decimals),
    explanationId: `Kriteria ${crit.nameId} bertipe Cost (lebih kecil lebih baik), sehingga nilai minimum kolom (${formatNum(stat.min, 2)}) dibagi nilai ${alt.nameId}.`,
    explanationEn: `Criterion ${crit.nameEn} is a Cost criterion (lower is better), so the column minimum (${formatNum(stat.min, 2)}) is divided by ${alt.nameEn}'s value.`,
  };
}

export function getWeightedCellTrace(
  model: CodasModel,
  result: CodasResult,
  altIdx: number,
  critIdx: number,
  decimals: number = 4,
): StepCellTrace {
  const alt = model.alternatives[altIdx];
  const crit = model.criteria[critIdx];
  const nVal = result.normalizedMatrix[altIdx][critIdx];
  const rVal = result.weightedNormalizedMatrix[altIdx][critIdx];
  const i1 = altIdx + 1;
  const j1 = critIdx + 1;

  return {
    step: 3,
    titleId: `Normalisasi Terbobot (${alt.id}, ${crit.id})`,
    titleEn: `Weighted Normalization (${alt.id}, ${crit.id})`,
    formulaSymbolic: "r_ij = w_j * n_ij",
    formulaSubstituted: `${formatNum(crit.weight, 4)} * ${formatNum(nVal, decimals)} = ${formatNum(rVal, decimals)}`,
    formulaLatex: String.raw`r_{ij} = w_j \cdot n_{ij}`,
    substitutedLatex: String.raw`r_{${i1},${j1}} = ${formatNum(crit.weight, 4)} \times ${formatNum(nVal, decimals)} = ${formatNum(rVal, decimals)}`,
    resultDisplay: formatNum(rVal, decimals),
    explanationId: `Nilai ternormalisasi ${alt.nameId} pada ${crit.nameId} dikalikan dengan bobot kriteria w_${j1} = ${formatNum(crit.weight, 4)}.`,
    explanationEn: `Normalized value of ${alt.nameEn} on ${crit.nameEn} is multiplied by criterion weight w_${j1} = ${formatNum(crit.weight, 4)}.`,
  };
}

export function getNegativeIdealTrace(
  model: CodasModel,
  result: CodasResult,
  critIdx: number,
  decimals: number = 4,
): StepCellTrace {
  const crit = model.criteria[critIdx];
  const colVals = result.weightedNormalizedMatrix.map((row) =>
    formatNum(row[critIdx], decimals),
  );
  const nsVal = result.negativeIdeal[critIdx];
  const j1 = critIdx + 1;

  return {
    step: 4,
    titleId: `Solusi Ideal Negatif (${crit.id})`,
    titleEn: `Negative-Ideal Solution (${crit.id})`,
    formulaSymbolic: "ns_j = min_i(r_ij)",
    formulaSubstituted: `min(${colVals.join(", ")}) = ${formatNum(nsVal, decimals)}`,
    formulaLatex: String.raw`ns_j = \min_i(r_{ij})`,
    substitutedLatex: String.raw`ns_{${j1}} = \min(${colVals.join(", ")}) = ${formatNum(nsVal, decimals)}`,
    resultDisplay: formatNum(nsVal, decimals),
    explanationId: `Titik referensi terburuk pada ${crit.nameId} adalah nilai terkecil dari seluruh alternatif pada matriks terbobot.`,
    explanationEn: `The worst-case reference point on ${crit.nameEn} is the minimum weighted normalized value across all alternatives.`,
  };
}

export function getDistanceTrace(
  model: CodasModel,
  result: CodasResult,
  altIdx: number,
  decimals: number = 4,
): StepCellTrace {
  const alt = model.alternatives[altIdx];
  const bd = result.distanceBreakdowns[altIdx];
  const i1 = altIdx + 1;
  const sqTerms = bd.perCriterionDiff.map(
    (d) => `(${formatNum(d, decimals)})^2`,
  );
  const absTerms = bd.perCriterionDiff.map(
    (d) => `|${formatNum(d, decimals)}|`,
  );

  return {
    step: 5,
    titleId: `Jarak terhadap Solusi Ideal Negatif (${alt.id})`,
    titleEn: `Distances to Negative-Ideal Solution (${alt.id})`,
    formulaSymbolic:
      "E_i = sqrt(sum_j (r_ij - ns_j)^2)  |  T_i = sum_j |r_ij - ns_j|",
    formulaSubstituted: `E_${i1} = sqrt(${sqTerms.join(" + ")}) = ${formatNum(bd.euclidean, decimals)}  |  T_${i1} = ${absTerms.join(" + ")} = ${formatNum(bd.taxicab, decimals)}`,
    formulaLatex: String.raw`E_i = \sqrt{\sum_{j=1}^{m}(r_{ij}-ns_j)^2}, \quad T_i = \sum_{j=1}^{m}|r_{ij}-ns_j|`,
    substitutedLatex: String.raw`\begin{aligned} E_{${i1}} &= \sqrt{${sqTerms.join(" + ")}} = ${formatNum(bd.euclidean, decimals)} \\ T_{${i1}} &= ${absTerms.join(" + ")} = ${formatNum(bd.taxicab, decimals)} \end{aligned}`,
    resultDisplay: `E = ${formatNum(bd.euclidean, decimals)}, T = ${formatNum(bd.taxicab, decimals)}`,
    explanationId: `Semakin besar E_${i1} dan T_${i1}, semakin jauh ${alt.nameId} dari solusi ideal negatif (semakin baik).`,
    explanationEn: `Larger E_${i1} and T_${i1} indicate ${alt.nameEn} is farther from the negative-ideal solution (more desirable).`,
  };
}

export function getRelativePairTrace(
  model: CodasModel,
  result: CodasResult,
  i: number,
  k: number,
  decimals: number = 4,
): StepCellTrace {
  const altI = model.alternatives[i];
  const altK = model.alternatives[k];
  const pair = result.relativePairs[i][k];
  const i1 = i + 1;
  const k1 = k + 1;

  const thresholdCompare =
    pair.psi === 1
      ? `|${formatNum(pair.eDiff, decimals)}| = ${formatNum(pair.absEDiff, decimals)} >= ${model.tau} -> psi = 1`
      : `|${formatNum(pair.eDiff, decimals)}| = ${formatNum(pair.absEDiff, decimals)} < ${model.tau} -> psi = 0`;

  const cmpOp = pair.psi === 1 ? String.raw`\ge` : "<";

  return {
    step: 6,
    titleId: `Penilaian Relatif (${altI.id} vs ${altK.id})`,
    titleEn: `Relative Assessment (${altI.id} vs ${altK.id})`,
    formulaSymbolic: "h_ik = (E_i - E_k) + psi(E_i - E_k) * (T_i - T_k)",
    formulaSubstituted: `(${formatNum(pair.eI, decimals)} - ${formatNum(pair.eK, decimals)}) + ${pair.psi} * (${formatNum(pair.tI, decimals)} - ${formatNum(pair.tK, decimals)}) = ${formatNum(pair.hIk, decimals)} [${thresholdCompare}]`,
    formulaLatex: String.raw`h_{ik} = (E_i - E_k) + \psi(E_i - E_k)(T_i - T_k)`,
    substitutedLatex: String.raw`\begin{aligned} h_{${i1},${k1}} &= (${formatNum(pair.eI, decimals)} - ${formatNum(pair.eK, decimals)}) + ${pair.psi} \cdot (${formatNum(pair.tI, decimals)} - ${formatNum(pair.tK, decimals)}) = ${formatNum(pair.hIk, decimals)} \\ |E_{${i1}} - E_{${k1}}| &= ${formatNum(pair.absEDiff, decimals)} ${cmpOp} \tau (${model.tau}) \implies \psi = ${pair.psi} \end{aligned}`,
    resultDisplay: formatNum(pair.hIk, decimals),
    explanationId:
      i === k
        ? `Perbandingan alternatif ${altI.nameId} terhadap dirinya sendiri selalu bernilai 0.`
        : pair.psi === 1
          ? `Selisih jarak Euclidean (${formatNum(pair.absEDiff, decimals)}) mencapai atau melampaui tau (${model.tau}), sehingga selisih jarak Taxicab ikut diperhitungkan.`
          : `Selisih jarak Euclidean (${formatNum(pair.absEDiff, decimals)}) lebih kecil dari tau (${model.tau}), sehingga psi = 0 dan jarak Taxicab tidak ditambahkan.`,
    explanationEn:
      i === k
        ? `Comparing ${altI.nameEn} with itself always yields 0.`
        : pair.psi === 1
          ? `The Euclidean distance gap (${formatNum(pair.absEDiff, decimals)}) meets or exceeds tau (${model.tau}), so the Taxicab distance difference is included.`
          : `The Euclidean distance gap (${formatNum(pair.absEDiff, decimals)}) is smaller than tau (${model.tau}), so psi = 0 and the Taxicab term is omitted.`,
  };
}

export function buildRankingExplanation(
  model: CodasModel,
  result: CodasResult,
  lang: Language,
  decimals: number = 4,
): string {
  if (result.ranking.length === 0) return "";
  const top = result.ranking[0];
  const topAlt = model.alternatives.find((a) => a.id === top.alternativeId);
  if (!topAlt) return "";

  const altIndex = model.alternatives.findIndex(
    (a) => a.id === top.alternativeId,
  );
  const topName = lang === "id" ? topAlt.nameId : topAlt.nameEn;

  const breakdown = result.distanceBreakdowns[altIndex];
  const topContribs = model.criteria
    .map((c, j) => ({
      criterion: c,
      diff: breakdown.perCriterionAbsDiff[j],
    }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 2)
    .filter((item) => item.diff > 0);

  const contribLabels = topContribs
    .map((item) =>
      lang === "id"
        ? `${item.criterion.nameId} (+${formatNum(item.diff, decimals)})`
        : `${item.criterion.nameEn} (+${formatNum(item.diff, decimals)})`,
    )
    .join(lang === "id" ? " dan " : " and ");

  const isTieTop = top.tieGroupSize > 1;
  const second = result.ranking[1];
  const secondAlt = second
    ? model.alternatives.find((a) => a.id === second.alternativeId)
    : undefined;

  if (lang === "id") {
    if (isTieTop) {
      return `${topName} (${topAlt.id}) menempati peringkat 1 bersama ${top.tieGroupSize - 1} alternatif lain dengan nilai penilaian H = ${formatNum(top.score, decimals)}, jarak Euclidean E = ${formatNum(top.euclidean, decimals)}, dan jarak Taxicab T = ${formatNum(top.taxicab, decimals)}.`;
    }
    const marginText =
      second && secondAlt
        ? ` Unggul sebesar ${formatNum(top.score - second.score, decimals)} poin di atas peringkat kedua (${secondAlt.nameId}, H = ${formatNum(second.score, decimals)}).`
        : "";
    const contribText = contribLabels
      ? ` Keunggulan utama berasal dari jarak terjauh terhadap solusi ideal negatif pada kriteria ${contribLabels}.`
      : "";
    return `${topName} (${topAlt.id}) meraih peringkat pertama dengan nilai penilaian tertinggi H = ${formatNum(top.score, decimals)}, didukung oleh jarak Euclidean E = ${formatNum(top.euclidean, decimals)} dan jarak Taxicab T = ${formatNum(top.taxicab, decimals)} pada parameter tau = ${model.tau}.${marginText}${contribText}`;
  }

  if (isTieTop) {
    return `${topName} (${topAlt.id}) ties for rank 1 with ${top.tieGroupSize - 1} other alternative(s) at assessment score H = ${formatNum(top.score, decimals)}, Euclidean distance E = ${formatNum(top.euclidean, decimals)}, and Taxicab distance T = ${formatNum(top.taxicab, decimals)}.`;
  }
  const marginText =
    second && secondAlt
      ? ` It leads the runner-up (${secondAlt.nameEn}, H = ${formatNum(second.score, decimals)}) by ${formatNum(top.score - second.score, decimals)}.`
      : "";
  const contribText = contribLabels
    ? ` Its strongest margins over the negative-ideal solution occur on ${contribLabels}.`
    : "";
  return `${topName} (${topAlt.id}) ranks first with the highest assessment score H = ${formatNum(top.score, decimals)}, driven by Euclidean distance E = ${formatNum(top.euclidean, decimals)} and Taxicab distance T = ${formatNum(top.taxicab, decimals)} under threshold tau = ${model.tau}.${marginText}${contribText}`;
}

import { formatNum } from "./formatCalculationTrace";
import type { CodasModel, CodasResult } from "./types";

export type AnimationStageId =
  | "normalize"
  | "weighted"
  | "ns"
  | "distances"
  | "relative"
  | "assessment"
  | "ranking";

export interface AnimationFrame {
  index: number;
  stage: AnimationStageId;
  stageNumber: number; // 1..7 inside animation timeline
  stageLabelId: string;
  stageLabelEn: string;
  operationTitleId: string;
  operationTitleEn: string;
  explanationId: string;
  explanationEn: string;
  /** Compiled KaTeX formula showing generic equation + substituted operands */
  formulaLatex: string;
  operandALabelId: string;
  operandALabelEn: string;
  operandAValue: string;
  operandBLabelId?: string;
  operandBLabelEn?: string;
  operandBValue?: string;
  resultLabelId: string;
  resultLabelEn: string;
  resultValue: string;
  /** Progress cutoff tracking which target entries are already revealed */
  revealedNormCount: number; // 0 .. n*m
  revealedWeightedCount: number; // 0 .. n*m
  revealedNsCount: number; // 0 .. m
  revealedDistCount: number; // 0 .. n
  revealedRelPairsCount: number; // index into offDiagonalPairs (0 .. n*(n-1))
  revealedScoreCount: number; // 0 .. n
  revealedRankCount: number; // 0 .. n
  /** Coordinate markers for high-contrast highlighting */
  activeNormCell?: { i: number; j: number };
  activeWeightedCell?: { i: number; j: number };
  activeNsCol?: number;
  activeDistRow?: number;
  activeRelPair?: { i: number; k: number };
  activeScoreRow?: number;
  activeRankPos?: number; // 0 .. n-1 into result.ranking
}

export interface AnimationStageSummary {
  id: AnimationStageId;
  stageNumber: number;
  labelId: string;
  labelEn: string;
  startIndex: number;
  count: number;
}

export interface AnimationTimeline {
  frames: AnimationFrame[];
  stages: AnimationStageSummary[];
}

export function buildCodasAnimationTimeline(
  model: CodasModel,
  result: CodasResult,
  decimals: number = 4,
): AnimationTimeline {
  const n = model.alternatives.length;
  const m = model.criteria.length;
  const frames: AnimationFrame[] = [];
  const stages: AnimationStageSummary[] = [];

  const totalNorm = n * m;
  const totalWeighted = n * m;
  const totalOffDiag = n * Math.max(0, n - 1);

  // -------------------------------------------------------------------------
  // STAGE 1: NORMALIZATION (X -> N)
  // -------------------------------------------------------------------------
  const s1Start = frames.length;
  let normDone = 0;
  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    for (let j = 0; j < m; j++) {
      const crit = model.criteria[j];
      const stat = result.columnStats[j];
      const xVal = result.decisionMatrix[i][j];
      const nVal = result.normalizedMatrix[i][j];
      normDone += 1;

      const isBenefit = crit.type === "benefit";
      const refVal = isBenefit ? stat.max : stat.min;
      const formulaLatex = isBenefit
        ? String.raw`n_{${i + 1},${j + 1}} = \frac{x_{${i + 1},${j + 1}}}{\max_i(x_{i,${j + 1}})} = \frac{${formatNum(xVal, 2)}}{${formatNum(refVal, 2)}} = ${formatNum(nVal, decimals)}`
        : String.raw`n_{${i + 1},${j + 1}} = \frac{\min_i(x_{i,${j + 1}})}{x_{${i + 1},${j + 1}}} = \frac{${formatNum(refVal, 2)}}{${formatNum(xVal, 2)}} = ${formatNum(nVal, decimals)}`;

      frames.push({
        index: frames.length,
        stage: "normalize",
        stageNumber: 1,
        stageLabelId: "1. Normalisasi (X -> N)",
        stageLabelEn: "1. Normalization (X -> N)",
        operationTitleId: `Normalisasi ${alt.id} (${alt.nameId}) pada ${crit.id} (${crit.nameId})`,
        operationTitleEn: `Normalize ${alt.id} (${alt.nameEn}) on ${crit.id} (${crit.nameEn})`,
        explanationId: isBenefit
          ? `${crit.id} bertipe Benefit: nilai ${alt.id} (${formatNum(xVal, 2)}) dibagi nilai maksimum kolom ${crit.id} (${formatNum(refVal, 2)}).`
          : `${crit.id} bertipe Cost: nilai minimum kolom ${crit.id} (${formatNum(refVal, 2)}) dibagi nilai ${alt.id} (${formatNum(xVal, 2)}).`,
        explanationEn: isBenefit
          ? `${crit.id} is Benefit: ${alt.id} score (${formatNum(xVal, 2)}) is divided by column maximum (${formatNum(refVal, 2)}).`
          : `${crit.id} is Cost: column minimum (${formatNum(refVal, 2)}) is divided by ${alt.id} score (${formatNum(xVal, 2)}).`,
        formulaLatex,
        operandALabelId: isBenefit
          ? `Nilai Asli x(${alt.id}, ${crit.id})`
          : `Minimum Kolom ${crit.id}`,
        operandALabelEn: isBenefit
          ? `Input x(${alt.id}, ${crit.id})`
          : `Column Min ${crit.id}`,
        operandAValue: isBenefit ? formatNum(xVal, 2) : formatNum(refVal, 2),
        operandBLabelId: isBenefit
          ? `Maksimum Kolom ${crit.id}`
          : `Nilai Asli x(${alt.id}, ${crit.id})`,
        operandBLabelEn: isBenefit
          ? `Column Max ${crit.id}`
          : `Input x(${alt.id}, ${crit.id})`,
        operandBValue: isBenefit ? formatNum(refVal, 2) : formatNum(xVal, 2),
        resultLabelId: `Hasil n(${alt.id}, ${crit.id})`,
        resultLabelEn: `Result n(${alt.id}, ${crit.id})`,
        resultValue: formatNum(nVal, decimals),
        revealedNormCount: normDone,
        revealedWeightedCount: 0,
        revealedNsCount: 0,
        revealedDistCount: 0,
        revealedRelPairsCount: 0,
        revealedScoreCount: 0,
        revealedRankCount: 0,
        activeNormCell: { i, j },
      });
    }
  }
  stages.push({
    id: "normalize",
    stageNumber: 1,
    labelId: "1. Normalisasi",
    labelEn: "1. Normalize",
    startIndex: s1Start,
    count: frames.length - s1Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 2: WEIGHTED NORMALIZED MATRIX (w_j * N -> R)
  // -------------------------------------------------------------------------
  const s2Start = frames.length;
  let weightedDone = 0;
  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    for (let j = 0; j < m; j++) {
      const crit = model.criteria[j];
      const nVal = result.normalizedMatrix[i][j];
      const rVal = result.weightedNormalizedMatrix[i][j];
      weightedDone += 1;

      frames.push({
        index: frames.length,
        stage: "weighted",
        stageNumber: 2,
        stageLabelId: "2. Pembobotan (w x N -> R)",
        stageLabelEn: "2. Weighting (w x N -> R)",
        operationTitleId: `Matriks Terbobot ${alt.id} pada ${crit.id}`,
        operationTitleEn: `Weighted Value ${alt.id} on ${crit.id}`,
        explanationId: `Bobot ${crit.id} (${formatNum(crit.weight, 4)}) dikalikan dengan nilai ternormalisasi n(${alt.id}, ${crit.id}) = ${formatNum(nVal, decimals)}.`,
        explanationEn: `Weight of ${crit.id} (${formatNum(crit.weight, 4)}) is multiplied by normalized value n(${alt.id}, ${crit.id}) = ${formatNum(nVal, decimals)}.`,
        formulaLatex: String.raw`r_{${i + 1},${j + 1}} = w_{${j + 1}} \times n_{${i + 1},${j + 1}} = ${formatNum(crit.weight, 4)} \times ${formatNum(nVal, decimals)} = ${formatNum(rVal, decimals)}`,
        operandALabelId: `Bobot Kriteria w(${crit.id})`,
        operandALabelEn: `Criterion Weight w(${crit.id})`,
        operandAValue: formatNum(crit.weight, 4),
        operandBLabelId: `Ternormalisasi n(${alt.id}, ${crit.id})`,
        operandBLabelEn: `Normalized n(${alt.id}, ${crit.id})`,
        operandBValue: formatNum(nVal, decimals),
        resultLabelId: `Hasil Terbobot r(${alt.id}, ${crit.id})`,
        resultLabelEn: `Weighted r(${alt.id}, ${crit.id})`,
        resultValue: formatNum(rVal, decimals),
        revealedNormCount: totalNorm,
        revealedWeightedCount: weightedDone,
        revealedNsCount: 0,
        revealedDistCount: 0,
        revealedRelPairsCount: 0,
        revealedScoreCount: 0,
        revealedRankCount: 0,
        activeWeightedCell: { i, j },
      });
    }
  }
  stages.push({
    id: "weighted",
    stageNumber: 2,
    labelId: "2. Terbobot",
    labelEn: "2. Weighted",
    startIndex: s2Start,
    count: frames.length - s2Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 3: NEGATIVE-IDEAL SOLUTION (min_i r_ij -> NS)
  // -------------------------------------------------------------------------
  const s3Start = frames.length;
  for (let j = 0; j < m; j++) {
    const crit = model.criteria[j];
    const nsVal = result.negativeIdeal[j];
    const colVals = result.weightedNormalizedMatrix.map((row) =>
      formatNum(row[j], decimals),
    );
    const minAlts = model.alternatives
      .filter(
        (_, rIdx) =>
          Math.abs(result.weightedNormalizedMatrix[rIdx][j] - nsVal) <= 1e-12,
      )
      .map((a) => a.id);

    frames.push({
      index: frames.length,
      stage: "ns",
      stageNumber: 3,
      stageLabelId: "3. Solusi Ideal Negatif (NS)",
      stageLabelEn: "3. Negative-Ideal Solution (NS)",
      operationTitleId: `Menentukan Solusi Ideal Negatif Kolom ${crit.id}`,
      operationTitleEn: `Find Negative-Ideal Solution for ${crit.id}`,
      explanationId: `Mengambil nilai terkecil pada seluruh baris kolom ${crit.id} di matriks terbobot R. Nilai minimum dicapai oleh ${minAlts.join(", ")}.`,
      explanationEn: `Selects the minimum value across all rows in column ${crit.id} of weighted matrix R. Minimum achieved by ${minAlts.join(", ")}.`,
      formulaLatex: String.raw`ns_{${j + 1}} = \min(${colVals.join(", ")}) = ${formatNum(nsVal, decimals)}`,
      operandALabelId: `Kolom ${crit.id} Matriks R`,
      operandALabelEn: `Column ${crit.id} of Matrix R`,
      operandAValue: `${n} baris`,
      operandBLabelId: "Alternatif Minimum",
      operandBLabelEn: "Minimum Source",
      operandBValue: minAlts.join(", "),
      resultLabelId: `Hasil ns(${crit.id})`,
      resultLabelEn: `Result ns(${crit.id})`,
      resultValue: formatNum(nsVal, decimals),
      revealedNormCount: totalNorm,
      revealedWeightedCount: totalWeighted,
      revealedNsCount: j + 1,
      revealedDistCount: 0,
      revealedRelPairsCount: 0,
      revealedScoreCount: 0,
      revealedRankCount: 0,
      activeNsCol: j,
    });
  }
  stages.push({
    id: "ns",
    stageNumber: 3,
    labelId: "3. Ideal Negatif",
    labelEn: "3. Neg-Ideal",
    startIndex: s3Start,
    count: frames.length - s3Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 4: EUCLIDEAN & TAXICAB DISTANCES (R - NS -> E_i, T_i)
  // -------------------------------------------------------------------------
  const s4Start = frames.length;
  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const bd = result.distanceBreakdowns[i];
    const sqTerms = bd.perCriterionDiff.map(
      (d) => `(${formatNum(d, decimals)})^2`,
    );
    const absTerms = bd.perCriterionDiff.map(
      (d) => `|${formatNum(d, decimals)}|`,
    );

    frames.push({
      index: frames.length,
      stage: "distances",
      stageNumber: 4,
      stageLabelId: "4. Jarak Euclidean & Taxicab",
      stageLabelEn: "4. Euclidean & Taxicab Distances",
      operationTitleId: `Menghitung Jarak ${alt.id} (${alt.nameId}) ke NS`,
      operationTitleEn: `Compute Distances from ${alt.id} (${alt.nameEn}) to NS`,
      explanationId: `Membandingkan seluruh kriteria baris ${alt.id} pada R terhadap vektor NS untuk memperoleh jarak kuadrat Euclidean (E) dan jarak absolut Taxicab (T).`,
      explanationEn: `Compares all criterion values of ${alt.id} in R against vector NS to obtain Euclidean distance (E) and Taxicab distance (T).`,
      formulaLatex: String.raw`\begin{aligned} E_{${i + 1}} &= \sqrt{${sqTerms.join(" + ")}} = ${formatNum(bd.euclidean, decimals)} \\ T_{${i + 1}} &= ${absTerms.join(" + ")} = ${formatNum(bd.taxicab, decimals)} \end{aligned}`,
      operandALabelId: `Baris ${alt.id} Matriks R`,
      operandALabelEn: `Row ${alt.id} of Matrix R`,
      operandAValue: `${m} kriteria`,
      operandBLabelId: "Vektor NS",
      operandBLabelEn: "Vector NS",
      operandBValue: `[${result.negativeIdeal.map((v) => formatNum(v, decimals)).join(", ")}]`,
      resultLabelId: `Hasil E(${alt.id}) / T(${alt.id})`,
      resultLabelEn: `Result E(${alt.id}) / T(${alt.id})`,
      resultValue: `E=${formatNum(bd.euclidean, decimals)} | T=${formatNum(bd.taxicab, decimals)}`,
      revealedNormCount: totalNorm,
      revealedWeightedCount: totalWeighted,
      revealedNsCount: m,
      revealedDistCount: i + 1,
      revealedRelPairsCount: 0,
      revealedScoreCount: 0,
      revealedRankCount: 0,
      activeDistRow: i,
    });
  }
  stages.push({
    id: "distances",
    stageNumber: 4,
    labelId: "4. Jarak E & T",
    labelEn: "4. Distances",
    startIndex: s4Start,
    count: frames.length - s4Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 5: RELATIVE ASSESSMENT PAIRS (E_i, E_k, T_i, T_k -> h_ik)
  // -------------------------------------------------------------------------
  const s5Start = frames.length;
  let pairCount = 0;
  for (let i = 0; i < n; i++) {
    const altI = model.alternatives[i];
    for (let k = 0; k < n; k++) {
      if (i === k) continue;
      const altK = model.alternatives[k];
      const pair = result.relativePairs[i][k];
      pairCount += 1;
      const cmpSym = pair.psi === 1 ? String.raw`\ge` : "<";

      frames.push({
        index: frames.length,
        stage: "relative",
        stageNumber: 5,
        stageLabelId: "5. Penilaian Relatif (h_ik)",
        stageLabelEn: "5. Relative Assessment (h_ik)",
        operationTitleId: `Perbandingan Berpasangan ${altI.id} vs ${altK.id}`,
        operationTitleEn: `Pairwise Comparison ${altI.id} vs ${altK.id}`,
        explanationId:
          pair.psi === 1
            ? `Selisih |E(${altI.id}) - E(${altK.id})| = ${formatNum(pair.absEDiff, decimals)} >= tau (${model.tau}), sehingga psi = 1 dan selisih Taxicab diikutsertakan.`
            : `Selisih |E(${altI.id}) - E(${altK.id})| = ${formatNum(pair.absEDiff, decimals)} < tau (${model.tau}), sehingga psi = 0 dan suku Taxicab dinolkan.`,
        explanationEn:
          pair.psi === 1
            ? `Euclidean gap |E(${altI.id}) - E(${altK.id})| = ${formatNum(pair.absEDiff, decimals)} >= tau (${model.tau}), so psi = 1 and Taxicab difference applies.`
            : `Euclidean gap |E(${altI.id}) - E(${altK.id})| = ${formatNum(pair.absEDiff, decimals)} < tau (${model.tau}), so psi = 0 and Taxicab term vanishes.`,
        formulaLatex: String.raw`\begin{aligned} |E_{${i + 1}} - E_{${k + 1}}| &= ${formatNum(pair.absEDiff, decimals)} ${cmpSym} ${model.tau} \implies \psi = ${pair.psi} \\ h_{${i + 1},${k + 1}} &= (${formatNum(pair.eI, decimals)} - ${formatNum(pair.eK, decimals)}) + ${pair.psi} \cdot (${formatNum(pair.tI, decimals)} - ${formatNum(pair.tK, decimals)}) = ${formatNum(pair.hIk, decimals)} \end{aligned}`,
        operandALabelId: `Baris ${altI.id} (E_i, T_i)`,
        operandALabelEn: `Row ${altI.id} (E_i, T_i)`,
        operandAValue: `E=${formatNum(pair.eI, decimals)}, T=${formatNum(pair.tI, decimals)}`,
        operandBLabelId: `Pembanding ${altK.id} (E_k, T_k)`,
        operandBLabelEn: `Peer ${altK.id} (E_k, T_k)`,
        operandBValue: `E=${formatNum(pair.eK, decimals)}, T=${formatNum(pair.tK, decimals)}`,
        resultLabelId: `Hasil h(${altI.id}, ${altK.id}) [psi=${pair.psi}]`,
        resultLabelEn: `Result h(${altI.id}, ${altK.id}) [psi=${pair.psi}]`,
        resultValue: formatNum(pair.hIk, decimals),
        revealedNormCount: totalNorm,
        revealedWeightedCount: totalWeighted,
        revealedNsCount: m,
        revealedDistCount: n,
        revealedRelPairsCount: pairCount,
        revealedScoreCount: 0,
        revealedRankCount: 0,
        activeRelPair: { i, k },
      });
    }
  }
  stages.push({
    id: "relative",
    stageNumber: 5,
    labelId: "5. Relatif h_ik",
    labelEn: "5. Relative h_ik",
    startIndex: s5Start,
    count: frames.length - s5Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 6: ASSESSMENT SCORE SUMMATION (sum_k h_ik -> H_i)
  // -------------------------------------------------------------------------
  const s6Start = frames.length;
  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const rowTerms = result.relativeAssessmentMatrix[i].map((v) =>
      formatNum(v, decimals),
    );
    const score = result.assessmentScores[i];

    frames.push({
      index: frames.length,
      stage: "assessment",
      stageNumber: 6,
      stageLabelId: "6. Penjumlahan Skor (H_i)",
      stageLabelEn: "6. Assessment Score (H_i)",
      operationTitleId: `Menjumlahkan Baris ${alt.id} untuk Skor H_${i + 1}`,
      operationTitleEn: `Summing Row ${alt.id} for Score H_${i + 1}`,
      explanationId: `Seluruh nilai perbandingan relatif pada baris ${alt.id} dijumlahkan menjadi skor agregat H(${alt.id}).`,
      explanationEn: `All relative assessment entries in row ${alt.id} are summed into aggregate score H(${alt.id}).`,
      formulaLatex: String.raw`H_{${i + 1}} = ${rowTerms.join(" + ")} = ${formatNum(score, decimals)}`,
      operandALabelId: `Seluruh Kolom Baris ${alt.id}`,
      operandALabelEn: `All Entries in Row ${alt.id}`,
      operandAValue: rowTerms.join(" + "),
      resultLabelId: `Skor H(${alt.id})`,
      resultLabelEn: `Score H(${alt.id})`,
      resultValue: formatNum(score, decimals),
      revealedNormCount: totalNorm,
      revealedWeightedCount: totalWeighted,
      revealedNsCount: m,
      revealedDistCount: n,
      revealedRelPairsCount: totalOffDiag,
      revealedScoreCount: i + 1,
      revealedRankCount: 0,
      activeScoreRow: i,
    });
  }
  stages.push({
    id: "assessment",
    stageNumber: 6,
    labelId: "6. Skor H_i",
    labelEn: "6. Score H_i",
    startIndex: s6Start,
    count: frames.length - s6Start,
  });

  // -------------------------------------------------------------------------
  // STAGE 7: FINAL RANKING (H_i descending -> Rank #1..#n)
  // -------------------------------------------------------------------------
  const s7Start = frames.length;
  for (let pos = 0; pos < result.ranking.length; pos++) {
    const rItem = result.ranking[pos];
    const altIdx = model.alternatives.findIndex(
      (a) => a.id === rItem.alternativeId,
    );
    const alt = model.alternatives[altIdx];

    frames.push({
      index: frames.length,
      stage: "ranking",
      stageNumber: 7,
      stageLabelId: "7. Perangkingan Akhir",
      stageLabelEn: "7. Final Ranking",
      operationTitleId: `Menetapkan Peringkat #${rItem.rank}: ${alt.id} (${alt.nameId})`,
      operationTitleEn: `Assign Rank #${rItem.rank}: ${alt.id} (${alt.nameEn})`,
      explanationId:
        rItem.rank === 1
          ? `${alt.id} (${alt.nameId}) memiliki skor penilaian H tertinggi (${formatNum(rItem.score, decimals)}), sehingga menjadi alternatif terbaik.`
          : `${alt.id} (${alt.nameId}) menempati peringkat #${rItem.rank} berdasarkan urutan skor H menurun (${formatNum(rItem.score, decimals)}).`,
      explanationEn:
        rItem.rank === 1
          ? `${alt.id} (${alt.nameEn}) achieves the highest assessment score H (${formatNum(rItem.score, decimals)}), making it the preferred choice.`
          : `${alt.id} (${alt.nameEn}) places at Rank #${rItem.rank} in descending order of score H (${formatNum(rItem.score, decimals)}).`,
      formulaLatex: String.raw`\text{Rank } \#${rItem.rank} \longleftarrow ${alt.id}\;\big(H_{${altIdx + 1}} = ${formatNum(rItem.score, decimals)}\big)`,
      operandALabelId: `Skor Penilaian H(${alt.id})`,
      operandALabelEn: `Assessment Score H(${alt.id})`,
      operandAValue: formatNum(rItem.score, decimals),
      operandBLabelId: "Jarak (E, T)",
      operandBLabelEn: "Distances (E, T)",
      operandBValue: `E=${formatNum(rItem.euclidean, decimals)}, T=${formatNum(rItem.taxicab, decimals)}`,
      resultLabelId: `Posisi Akhir`,
      resultLabelEn: `Final Position`,
      resultValue: `Rank #${rItem.rank}: ${alt.id}`,
      revealedNormCount: totalNorm,
      revealedWeightedCount: totalWeighted,
      revealedNsCount: m,
      revealedDistCount: n,
      revealedRelPairsCount: totalOffDiag,
      revealedScoreCount: n,
      revealedRankCount: pos + 1,
      activeScoreRow: altIdx,
      activeRankPos: pos,
    });
  }
  stages.push({
    id: "ranking",
    stageNumber: 7,
    labelId: "7. Peringkat",
    labelEn: "7. Ranking",
    startIndex: s7Start,
    count: frames.length - s7Start,
  });

  return { frames, stages };
}


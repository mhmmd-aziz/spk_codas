import { useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCw,
  Sigma,
} from "lucide-react";
import {
  STEP_LATEX_FORMULAS,
  formatNum,
  getDistanceTrace,
  getNegativeIdealTrace,
  getNormalizationCellTrace,
  getRelativePairTrace,
  getWeightedCellTrace,
  type StepCellTrace,
} from "../domain/codas/formatCalculationTrace";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";
import { CriterionBadge } from "./CriterionBadge";
import { MathBlock } from "./MathBlock";

interface CalculationWalkthroughPageProps {
  model: CodasModel;
  result: CodasResult | null;
  lang: Language;
  decimals: number;
  modelRevision: number;
}

export function CalculationWalkthroughPage({
  model,
  result,
  lang,
  decimals,
  modelRevision,
}: CalculationWalkthroughPageProps) {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<number>(1);
  const [showFormula, setShowFormula] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Active cell / row / pair selection for highlighting & trace inspection
  const [selectedAltIdx, setSelectedAltIdx] = useState<number>(0);
  const [selectedCritIdx, setSelectedCritIdx] = useState<number>(0);
  const [pairI, setPairI] = useState<number>(0);
  const [pairK, setPairK] = useState<number>(1);

  const safeAltIdx =
    selectedAltIdx < model.alternatives.length ? selectedAltIdx : 0;
  const safeCritIdx =
    selectedCritIdx < model.criteria.length ? selectedCritIdx : 0;
  const safePairI = pairI < model.alternatives.length ? pairI : 0;
  const safePairK =
    pairK < model.alternatives.length
      ? pairK
      : Math.min(1, Math.max(0, model.alternatives.length - 1));

  const currentStepMeta = t.walkthrough.steps[step - 1];

  const activeTrace: StepCellTrace | null = useMemo(() => {
    if (!result) return null;
    if (model.alternatives.length === 0 || model.criteria.length === 0) {
      return null;
    }

    switch (step) {
      case 1: {
        const alt = model.alternatives[safeAltIdx];
        const crit = model.criteria[safeCritIdx];
        const x = result.decisionMatrix[safeAltIdx][safeCritIdx];
        return {
          step: 1,
          titleId: `Nilai Keputusan (${alt.id}, ${crit.id})`,
          titleEn: `Decision Value (${alt.id}, ${crit.id})`,
          formulaSymbolic: "x_ij",
          formulaSubstituted: `x_(${safeAltIdx + 1},${safeCritIdx + 1}) = ${formatNum(x, 2)}`,
          formulaLatex: String.raw`x_{ij}`,
          substitutedLatex: String.raw`x_{${safeAltIdx + 1},${safeCritIdx + 1}} = ${formatNum(x, 2)}`,
          resultDisplay: formatNum(x, 2),
          explanationId: `Nilai kinerja ${alt.nameId} pada kriteria ${crit.nameId} (${crit.type === "benefit" ? "Benefit" : "Cost"}).`,
          explanationEn: `Performance score of ${alt.nameEn} on criterion ${crit.nameEn} (${crit.type === "benefit" ? "Benefit" : "Cost"}).`,
        };
      }
      case 2:
        return getNormalizationCellTrace(
          model,
          result,
          safeAltIdx,
          safeCritIdx,
          decimals,
        );
      case 3:
        return getWeightedCellTrace(
          model,
          result,
          safeAltIdx,
          safeCritIdx,
          decimals,
        );
      case 4:
        return getNegativeIdealTrace(model, result, safeCritIdx, decimals);
      case 5:
        return getDistanceTrace(model, result, safeAltIdx, decimals);
      case 6:
        return getRelativePairTrace(
          model,
          result,
          safePairI,
          safePairK,
          decimals,
        );
      case 7: {
        const alt = model.alternatives[safeAltIdx];
        const rowTerms = result.relativeAssessmentMatrix[safeAltIdx].map((v) =>
          formatNum(v, decimals),
        );
        const hVal = result.assessmentScores[safeAltIdx];
        return {
          step: 7,
          titleId: `Skor Penilaian Akhir (${alt.id})`,
          titleEn: `Assessment Score (${alt.id})`,
          formulaSymbolic: "H_i = sum_(k=1)^n h_ik",
          formulaSubstituted: `${rowTerms.join(" + ")} = ${formatNum(hVal, decimals)}`,
          formulaLatex: String.raw`H_i = \sum_{k=1}^{n} h_{ik}`,
          substitutedLatex: String.raw`H_{${safeAltIdx + 1}} = ${rowTerms.join(" + ")} = ${formatNum(hVal, decimals)}`,
          resultDisplay: formatNum(hVal, decimals),
          explanationId: `Jumlah seluruh nilai perbandingan relatif pada baris ${alt.nameId}.`,
          explanationEn: `Sum of all relative assessment entries in ${alt.nameEn}'s row.`,
        };
      }
      case 8: {
        const top = result.ranking[0];
        const alt = model.alternatives.find((a) => a.id === top.alternativeId)!;
        return {
          step: 8,
          titleId: `Peringkat 1: ${alt.id} (${alt.nameId})`,
          titleEn: `Rank 1: ${alt.id} (${alt.nameEn})`,
          formulaSymbolic: "Rank 1 = argmax_i H_i",
          formulaSubstituted: `H = ${formatNum(top.score, decimals)}`,
          formulaLatex: String.raw`\text{Rank } 1 = \arg\max_i H_i`,
          substitutedLatex: String.raw`H_{\max} = ${formatNum(top.score, decimals)}`,
          resultDisplay: `${alt.id} (#1)`,
          explanationId: t.walkthrough.tieNote,
          explanationEn: t.walkthrough.tieNote,
        };
      }
      default:
        return null;
    }
  }, [
    result,
    model,
    step,
    safeAltIdx,
    safeCritIdx,
    safePairI,
    safePairK,
    decimals,
    t.walkthrough.tieNote,
  ]);

  if (!result) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900"
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <h2>{t.walkthrough.invalidBlockedTitle}</h2>
        </div>
        <p className="mt-2 text-sm">{t.walkthrough.invalidBlockedBody}</p>
      </div>
    );
  }

  const pairDetail = result.relativePairs[safePairI]?.[safePairK];

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Header & Step Controls */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t.walkthrough.heading}
                </h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  {t.walkthrough.recalculatedBadge} (v{modelRevision})
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {t.walkthrough.subheading}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={showFormula}
                onClick={() => setShowFormula((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  showFormula
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.walkthrough.showFormula}</span>
              </button>

              <button
                type="button"
                aria-pressed={showDetails}
                onClick={() => setShowDetails((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  showDetails
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.walkthrough.showDetails}</span>
              </button>

              <button
                type="button"
                onClick={() => setReplayKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.walkthrough.replay}</span>
              </button>
            </div>
          </div>

          {/* Persistent Stepper Navigation */}
          <nav
            aria-label={t.walkthrough.heading}
            className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
          >
            {t.walkthrough.steps.map((s) => {
              const isCurrent = s.number === step;
              const isDone = s.number < step;
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setStep(s.number)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    isCurrent
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/70"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex w-full items-center justify-between text-[11px] font-semibold">
                    <span>0{s.number}</span>
                    {isDone && (
                      <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    )}
                  </div>
                  <span className="mt-1 line-clamp-1 text-xs font-medium">
                    {s.shortTitle}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Progress & Prev/Next Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.walkthrough.stepOf
                .replace("{current}", String(step))
                .replace("{total}", "8")}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>{t.walkthrough.previous}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(8, s + 1))}
                disabled={step === 8}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:opacity-40"
              >
                <span>{t.walkthrough.next}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Animated Active Stage */}
        <AnimatePresence mode="wait">
          <motion.section
            key={`step-${step}-rev-${modelRevision}-rep-${replayKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {currentStepMeta.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {currentStepMeta.description}
              </p>

              {showFormula && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
                  <MathBlock tex={STEP_LATEX_FORMULAS[step]} displayMode />
                </div>
              )}
            </div>

            {/* STEP 1: DECISION MATRIX */}
            {step === 1 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {t.walkthrough.clickCellHint}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">{t.common.alternative}</th>
                        {model.criteria.map((c, j) => (
                          <th key={c.id} className="px-3 py-2.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs">
                                {c.id}: {lang === "id" ? c.nameId : c.nameEn}
                              </span>
                              <CriterionBadge type={c.type} lang={lang} compact />
                            </div>
                            <span className="sr-only">Col {j + 1}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((alt, i) => (
                        <tr
                          key={alt.id}
                          className={
                            i === safeAltIdx ? "bg-sky-50/40" : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            <span className="font-mono text-xs text-slate-500">
                              {alt.id}
                            </span>{" "}
                            {lang === "id" ? alt.nameId : alt.nameEn}
                          </td>
                          {model.criteria.map((c, j) => {
                            const isSelected =
                              i === safeAltIdx && j === safeCritIdx;
                            return (
                              <td key={c.id} className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAltIdx(i);
                                    setSelectedCritIdx(j);
                                  }}
                                  className={`w-full rounded-md px-2.5 py-1.5 text-right font-mono text-xs tabular-nums transition-colors ${
                                    isSelected
                                      ? "bg-slate-900 font-semibold text-white"
                                      : "bg-slate-100/70 text-slate-800 hover:bg-slate-200/80"
                                  }`}
                                >
                                  {formatNum(result.decisionMatrix[i][j], 2)}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 2: NORMALIZED MATRIX */}
            {step === 2 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {t.walkthrough.clickCellHint}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">{t.common.alternative}</th>
                        {model.criteria.map((c, j) => {
                          const stat = result.columnStats[j];
                          return (
                            <th key={c.id} className="px-3 py-2.5">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs">{c.id}</span>
                                <CriterionBadge
                                  type={c.type}
                                  lang={lang}
                                  compact
                                />
                                <span className="font-mono text-[11px] font-normal text-slate-500">
                                  {c.type === "benefit"
                                    ? `max=${formatNum(stat.max, 2)}`
                                    : `min=${formatNum(stat.min, 2)}`}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((alt, i) => (
                        <tr
                          key={alt.id}
                          className={
                            i === safeAltIdx ? "bg-sky-50/40" : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            <span className="font-mono text-xs text-slate-500">
                              {alt.id}
                            </span>{" "}
                            {lang === "id" ? alt.nameId : alt.nameEn}
                          </td>
                          {model.criteria.map((c, j) => {
                            const isSelected =
                              i === safeAltIdx && j === safeCritIdx;
                            const xVal = result.decisionMatrix[i][j];
                            const stat = result.columnStats[j];
                            const formulaHint =
                              c.type === "benefit"
                                ? `${formatNum(xVal, 2)} / ${formatNum(stat.max, 2)}`
                                : `${formatNum(stat.min, 2)} / ${formatNum(xVal, 2)}`;
                            return (
                              <td key={c.id} className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAltIdx(i);
                                    setSelectedCritIdx(j);
                                  }}
                                  className={`w-full rounded-md px-2.5 py-1.5 text-right font-mono text-xs tabular-nums transition-colors ${
                                    isSelected
                                      ? "bg-slate-900 font-semibold text-white"
                                      : j === safeCritIdx
                                        ? "bg-sky-100 text-sky-950"
                                        : "bg-slate-100/70 text-slate-800 hover:bg-slate-200/80"
                                  }`}
                                >
                                  <div>
                                    {formatNum(
                                      result.normalizedMatrix[i][j],
                                      decimals,
                                    )}
                                  </div>
                                  {showDetails && (
                                    <div
                                      className={`mt-0.5 text-[10px] font-normal ${
                                        isSelected
                                          ? "text-slate-300"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {formulaHint}
                                    </div>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 3: WEIGHTED NORMALIZED MATRIX */}
            {step === 3 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {t.walkthrough.clickCellHint}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">{t.common.alternative}</th>
                        {model.criteria.map((c) => (
                          <th key={c.id} className="px-3 py-2.5">
                            <div className="font-mono text-xs">{c.id}</div>
                            <div className="font-mono text-[11px] font-normal text-slate-500">
                              w = {formatNum(c.weight, 4)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((alt, i) => (
                        <tr
                          key={alt.id}
                          className={
                            i === safeAltIdx ? "bg-sky-50/40" : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            <span className="font-mono text-xs text-slate-500">
                              {alt.id}
                            </span>{" "}
                            {lang === "id" ? alt.nameId : alt.nameEn}
                          </td>
                          {model.criteria.map((c, j) => {
                            const isSelected =
                              i === safeAltIdx && j === safeCritIdx;
                            const nVal = result.normalizedMatrix[i][j];
                            return (
                              <td key={c.id} className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAltIdx(i);
                                    setSelectedCritIdx(j);
                                  }}
                                  className={`w-full rounded-md px-2.5 py-1.5 text-right font-mono text-xs tabular-nums transition-colors ${
                                    isSelected
                                      ? "bg-slate-900 font-semibold text-white"
                                      : "bg-slate-100/70 text-slate-800 hover:bg-slate-200/80"
                                  }`}
                                >
                                  <div>
                                    {formatNum(
                                      result.weightedNormalizedMatrix[i][j],
                                      decimals,
                                    )}
                                  </div>
                                  {showDetails && (
                                    <div
                                      className={`mt-0.5 text-[10px] font-normal ${
                                        isSelected
                                          ? "text-slate-300"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {formatNum(c.weight, 4)} x {formatNum(nVal, decimals)}
                                    </div>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 4: NEGATIVE-IDEAL SOLUTION */}
            {step === 4 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {t.walkthrough.clickCellHint}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">{t.common.alternative}</th>
                        {model.criteria.map((c, j) => (
                          <th key={c.id} className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCritIdx(j)}
                              className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                                j === safeCritIdx
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {c.id}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((alt, i) => (
                        <tr key={alt.id}>
                          <td className="px-3 py-2 text-slate-800">
                            <span className="font-mono text-xs text-slate-500">
                              {alt.id}
                            </span>{" "}
                            {lang === "id" ? alt.nameId : alt.nameEn}
                          </td>
                          {model.criteria.map((c, j) => {
                            const val = result.weightedNormalizedMatrix[i][j];
                            const isMin =
                              Math.abs(val - result.negativeIdeal[j]) <= 1e-12;
                            return (
                              <td
                                key={c.id}
                                onClick={() => setSelectedCritIdx(j)}
                                className={`cursor-pointer px-3 py-2 text-right font-mono text-xs tabular-nums ${
                                  isMin
                                    ? "bg-amber-50 font-semibold text-amber-900"
                                    : j === safeCritIdx
                                      ? "bg-sky-50/60 text-slate-800"
                                      : "text-slate-600"
                                }`}
                              >
                                {formatNum(val, decimals)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-300 bg-emerald-50/70 font-semibold">
                        <td className="px-3 py-2.5 text-emerald-950">
                          NS (min_i r_ij)
                        </td>
                        {result.negativeIdeal.map((nsVal, j) => {
                          const minAlts = model.alternatives
                            .filter(
                              (_, rowIdx) =>
                                Math.abs(
                                  result.weightedNormalizedMatrix[rowIdx][j] - nsVal,
                                ) <= 1e-12,
                            )
                            .map((a) => a.id);
                          return (
                            <td
                              key={model.criteria[j].id}
                              onClick={() => setSelectedCritIdx(j)}
                              className={`cursor-pointer px-3 py-2.5 text-right font-mono text-xs tabular-nums ${
                                j === safeCritIdx
                                  ? "bg-slate-900 text-white"
                                  : "text-emerald-900"
                              }`}
                            >
                              <div>{formatNum(nsVal, decimals)}</div>
                              {showDetails && minAlts.length > 0 && (
                                <div
                                  className={`mt-0.5 text-[10px] font-normal ${
                                    j === safeCritIdx
                                      ? "text-slate-300"
                                      : "text-emerald-800"
                                  }`}
                                >
                                  min ({minAlts.join(", ")})
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 5: EUCLIDEAN & TAXICAB DISTANCES */}
            {step === 5 && (
              <div className="mt-4 space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">{t.common.alternative}</th>
                        <th className="px-3 py-2.5 text-right">
                          {t.ranking.euclideanLabel}
                        </th>
                        <th className="px-3 py-2.5 text-right">
                          {t.ranking.taxicabLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((alt, i) => {
                        const isSelected = i === safeAltIdx;
                        const bd = result.distanceBreakdowns[i];
                        const sumSq = bd.perCriterionSquaredDiff.reduce(
                          (s, v) => s + v,
                          0,
                        );
                        return (
                          <tr
                            key={alt.id}
                            onClick={() => setSelectedAltIdx(i)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-3 py-2.5 font-medium">
                              <span className="font-mono text-xs opacity-75">
                                {alt.id}
                              </span>{" "}
                              {lang === "id" ? alt.nameId : alt.nameEn}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                              <div className="font-semibold">
                                {formatNum(result.euclideanDistances[i], decimals)}
                              </div>
                              {showDetails && (
                                <div
                                  className={`mt-0.5 text-[10px] ${
                                    isSelected
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  }`}
                                >
                                  sqrt({formatNum(sumSq, decimals)})
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                              <div className="font-semibold">
                                {formatNum(result.taxicabDistances[i], decimals)}
                              </div>
                              {showDetails && (
                                <div
                                  className={`mt-0.5 text-[10px] ${
                                    isSelected
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  }`}
                                >
                                  sum(|r_ij - ns_j|)
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Per-criterion distance contribution breakdown */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    {t.walkthrough.perCriterionBreakdownTitle} (
                    {model.alternatives[safeAltIdx].id}:{" "}
                    {lang === "id"
                      ? model.alternatives[safeAltIdx].nameId
                      : model.alternatives[safeAltIdx].nameEn}
                    )
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600">
                          <th className="px-2.5 py-2">{t.common.criterion}</th>
                          <th className="px-2.5 py-2 text-right">r_ij</th>
                          <th className="px-2.5 py-2 text-right">ns_j</th>
                          <th className="px-2.5 py-2 text-right">r_ij - ns_j</th>
                          <th className="px-2.5 py-2 text-right">
                            |r_ij - ns_j|
                          </th>
                          <th className="px-2.5 py-2 text-right">
                            (r_ij - ns_j)^2
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 font-mono tabular-nums">
                        {model.criteria.map((c, j) => {
                          const bd = result.distanceBreakdowns[safeAltIdx];
                          const rVal =
                            result.weightedNormalizedMatrix[safeAltIdx][j];
                          const nsVal = result.negativeIdeal[j];
                          const diff = bd.perCriterionDiff[j];
                          return (
                            <tr key={c.id}>
                              <td className="px-2.5 py-2 font-sans font-medium text-slate-800">
                                {c.id}: {lang === "id" ? c.nameId : c.nameEn}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                {formatNum(rVal, decimals)}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                {formatNum(nsVal, decimals)}
                              </td>
                              <td className="px-2.5 py-2 text-right text-slate-600">
                                {formatNum(diff, decimals)}
                              </td>
                              <td className="px-2.5 py-2 text-right font-semibold text-slate-900">
                                {formatNum(bd.perCriterionAbsDiff[j], decimals)}
                              </td>
                              <td className="px-2.5 py-2 text-right font-semibold text-slate-900">
                                <div>
                                  {formatNum(
                                    bd.perCriterionSquaredDiff[j],
                                    decimals,
                                  )}
                                </div>
                                {showDetails && (
                                  <div className="text-[10px] font-normal text-slate-500">
                                    ({formatNum(diff, decimals)})^2
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const bd = result.distanceBreakdowns[safeAltIdx];
                          const sumSq = bd.perCriterionSquaredDiff.reduce(
                            (s, v) => s + v,
                            0,
                          );
                          return (
                            <tr className="border-t-2 border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900">
                              <td colSpan={4} className="px-2.5 py-2 font-sans">
                                {lang === "id"
                                  ? "Total & Akar Kuadrat (Sumber E_i dan T_i)"
                                  : "Column Sum & Root (Source of E_i and T_i)"}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                T = {formatNum(bd.taxicab, decimals)}
                              </td>
                              <td className="px-2.5 py-2 text-right">
                                <div>Sum = {formatNum(sumSq, decimals)}</div>
                                <div className="text-[10px] font-normal text-slate-600">
                                  sqrt({formatNum(sumSq, decimals)}) = E ={" "}
                                  {formatNum(bd.euclidean, decimals)}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: RELATIVE ASSESSMENT MATRIX + PAIRWISE EXPLORER */}
            {step === 6 && (
              <div className="mt-4 space-y-6">
                <p className="text-xs text-slate-600">
                  {t.walkthrough.tauRoleNote} (tau ={" "}
                  <span className="font-mono font-semibold">{model.tau}</span>)
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{currentStepMeta.title}</caption>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        <th className="px-3 py-2.5">i / k</th>
                        {model.alternatives.map((alt) => (
                          <th key={alt.id} className="px-3 py-2.5 text-right font-mono">
                            {alt.id}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-right font-mono">
                          H_i = sum h_ik
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {model.alternatives.map((altI, i) => (
                        <tr key={altI.id}>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-800">
                            {altI.id}
                          </td>
                          {model.alternatives.map((altK, k) => {
                            const isSelected =
                              i === safePairI && k === safePairK;
                            const val = result.relativeAssessmentMatrix[i][k];
                            const pair = result.relativePairs[i][k];
                            return (
                              <td key={altK.id} className="px-2 py-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPairI(i);
                                    setPairK(k);
                                  }}
                                  className={`w-full rounded px-2 py-1 text-right font-mono text-xs tabular-nums transition-colors ${
                                    isSelected
                                      ? "bg-slate-900 font-semibold text-white"
                                      : i === k
                                        ? "bg-slate-100 text-slate-400"
                                        : val >= 0
                                          ? "bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100"
                                          : "bg-rose-50/70 text-rose-950 hover:bg-rose-100"
                                  }`}
                                >
                                  <div>{formatNum(val, decimals)}</div>
                                  {showDetails && i !== k && (
                                    <div
                                      className={`mt-0.5 text-[10px] font-normal ${
                                        isSelected
                                          ? "text-slate-300"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {formatNum(pair.eDiff, decimals)} + {pair.psi}*(
                                      {formatNum(pair.tDiff, decimals)})
                                    </div>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                          <td className="bg-slate-50 px-3 py-1.5 text-right font-mono text-xs font-bold tabular-nums text-slate-900">
                            {formatNum(result.assessmentScores[i], decimals)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pairwise Inspector */}
                {pairDetail && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {t.walkthrough.pairwiseExplorerTitle}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {t.walkthrough.pairwiseExplorerHint}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <span>{t.walkthrough.selectRowAlt}:</span>
                          <select
                            value={safePairI}
                            onChange={(e) => setPairI(Number(e.target.value))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {model.alternatives.map((a, idx) => (
                              <option key={a.id} value={idx}>
                                {a.id}: {lang === "id" ? a.nameId : a.nameEn}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <span>{t.walkthrough.selectColAlt}:</span>
                          <select
                            value={safePairK}
                            onChange={(e) => setPairK(Number(e.target.value))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {model.alternatives.map((a, idx) => (
                              <option key={a.id} value={idx}>
                                {a.id}: {lang === "id" ? a.nameId : a.nameEn}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      <div className="rounded-md border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] text-slate-500">E_i</div>
                        <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatNum(pairDetail.eI, decimals)}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] text-slate-500">E_k</div>
                        <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatNum(pairDetail.eK, decimals)}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] text-slate-500">T_i</div>
                        <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatNum(pairDetail.tI, decimals)}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] text-slate-500">T_k</div>
                        <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatNum(pairDetail.tK, decimals)}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-2.5">
                        <div className="text-[11px] text-slate-500">
                          psi (tau={model.tau})
                        </div>
                        <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {pairDetail.psi} (|dE|={formatNum(pairDetail.absEDiff, decimals)})
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-900 bg-slate-900 p-2.5 text-white">
                        <div className="text-[11px] text-slate-300">h_ik</div>
                        <div className="font-mono text-xs font-bold tabular-nums">
                          {formatNum(pairDetail.hIk, decimals)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: ASSESSMENT SCORES */}
            {step === 7 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">{currentStepMeta.title}</caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      <th className="px-3 py-2.5">{t.common.alternative}</th>
                      <th className="px-3 py-2.5">
                        {lang === "id"
                          ? "Asal Penjumlahan Baris Matriks Relatif (sum_k h_ik)"
                          : "Row Sum Derivation from Step 6 (sum_k h_ik)"}
                      </th>
                      <th className="px-3 py-2.5 text-right">
                        {t.ranking.assessmentScoreLabel}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {model.alternatives.map((alt, i) => {
                      const rowTrace = result.relativeAssessmentMatrix[i]
                        .map((v) => formatNum(v, decimals))
                        .join(" + ");
                      return (
                        <tr
                          key={alt.id}
                          onClick={() => setSelectedAltIdx(i)}
                          className={`cursor-pointer ${
                            i === safeAltIdx
                              ? "bg-slate-900 text-white"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-2.5 font-medium">
                            <span className="font-mono text-xs opacity-75">
                              {alt.id}
                            </span>{" "}
                            {lang === "id" ? alt.nameId : alt.nameEn}
                          </td>
                          <td
                            className={`px-3 py-2.5 font-mono text-xs tabular-nums ${
                              i === safeAltIdx ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {rowTrace}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm font-bold tabular-nums">
                            {formatNum(result.assessmentScores[i], decimals)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* STEP 8: FINAL RANKING (Animated positions) */}
            {step === 8 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600">{t.walkthrough.tieNote}</p>
                <div className="space-y-2.5">
                  {result.ranking.map((item, pos) => {
                    const alt = model.alternatives.find(
                      (a) => a.id === item.alternativeId,
                    )!;
                    const isFirst = item.rank === 1;
                    return (
                      <motion.div
                        key={item.alternativeId}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: pos * 0.05 }}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                          isFirst
                            ? "border-emerald-300 bg-emerald-50/80"
                            : "border-slate-200 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-bold ${
                              isFirst
                                ? "bg-emerald-700 text-white"
                                : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            #{item.rank}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">
                              <span className="font-mono text-xs text-slate-500">
                                {alt.id}
                              </span>{" "}
                              {lang === "id" ? alt.nameId : alt.nameEn}
                            </div>
                            <div className="font-mono text-xs text-slate-500">
                              E = {formatNum(item.euclidean, decimals)} | T ={" "}
                              {formatNum(item.taxicab, decimals)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            H_i
                          </div>
                          <div className="font-mono text-base font-bold tabular-nums text-slate-900">
                            {formatNum(item.score, decimals)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        {/* Detailed Cell Inspection Card */}
        {showDetails && activeTrace && (
          <section
            aria-live="polite"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {t.walkthrough.selectedInspectionTitle}:{" "}
                <span className="text-slate-700">
                  {lang === "id" ? activeTrace.titleId : activeTrace.titleEn}
                </span>
              </h3>
              <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold text-white">
                {t.walkthrough.resultLabel}: {activeTrace.resultDisplay}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t.walkthrough.formulaLabel}
                </div>
                <div className="mt-2 text-sm text-slate-900">
                  <MathBlock tex={activeTrace.formulaLatex} />
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t.walkthrough.substitutionLabel}
                </div>
                <div className="mt-2 text-sm text-slate-900">
                  <MathBlock tex={activeTrace.substitutedLatex} />
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {lang === "id"
                ? activeTrace.explanationId
                : activeTrace.explanationEn}
            </p>
          </section>
        )}
      </div>
    </MotionConfig>
  );
}


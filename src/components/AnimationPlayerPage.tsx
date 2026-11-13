import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  buildCodasAnimationTimeline,
  type AnimationFrame,
} from "../domain/codas/buildAnimationFrames";
import { formatNum } from "../domain/codas/formatCalculationTrace";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";
import { MathBlock } from "./MathBlock";

interface AnimationPlayerPageProps {
  model: CodasModel;
  result: CodasResult | null;
  lang: Language;
  decimals: number;
  modelRevision: number;
}

const SPEED_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: "0.5x", ms: 1800 },
  { label: "1x", ms: 1000 },
  { label: "2x", ms: 500 },
  { label: "4x", ms: 220 },
];

export function AnimationPlayerPage({
  model,
  result,
  lang,
  decimals,
  modelRevision,
}: AnimationPlayerPageProps) {
  const t = TRANSLATIONS[lang];
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1000);
  const [prevRevision, setPrevRevision] = useState<number>(modelRevision);

  if (modelRevision !== prevRevision) {
    setPrevRevision(modelRevision);
    setFrameIndex(0);
    setIsPlaying(false);
  }

  const timeline = useMemo(() => {
    if (!result) return null;
    return buildCodasAnimationTimeline(model, result, decimals);
  }, [model, result, decimals]);

  const totalFrames = timeline?.frames.length ?? 0;
  const safeIndex =
    totalFrames > 0 ? Math.min(Math.max(0, frameIndex), totalFrames - 1) : 0;
  const currentFrame: AnimationFrame | null =
    timeline && totalFrames > 0 ? timeline.frames[safeIndex] : null;

  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;
    const timer = window.setTimeout(() => {
      if (safeIndex >= totalFrames - 1) {
        setIsPlaying(false);
      } else {
        setFrameIndex((idx) => Math.min(totalFrames - 1, idx + 1));
      }
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, safeIndex, totalFrames, speedMs]);

  if (!result || !timeline || !currentFrame) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900"
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <h2>{t.animation.heading}</h2>
        </div>
        <p className="mt-2 text-sm">{t.animation.invalidBlocked}</p>
      </div>
    );
  }

  const n = model.alternatives.length;
  const m = model.criteria.length;

  const isCellRevealed = (row: number, col: number, count: number): boolean =>
    row * m + col < count;

  const offDiagOrder = (i: number, k: number): number => {
    if (i === k) return -1;
    let ord = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r === c) continue;
        ord += 1;
        if (r === i && c === k) return ord;
      }
    }
    return -1;
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (safeIndex >= totalFrames - 1) {
      setFrameIndex(0);
    }
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setFrameIndex(0);
  };

  const stageTitle =
    lang === "id" ? currentFrame.stageLabelId : currentFrame.stageLabelEn;
  const opTitle =
    lang === "id"
      ? currentFrame.operationTitleId
      : currentFrame.operationTitleEn;
  const explanation =
    lang === "id" ? currentFrame.explanationId : currentFrame.explanationEn;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Playback Controls Header */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t.animation.heading}
                </h2>
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
                  {isPlaying ? t.animation.statusPlaying : t.animation.statusPaused}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {t.animation.subheading}
              </p>
            </div>

            {/* Playback buttons + Speed */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {isPlaying
                    ? t.animation.pause
                    : safeIndex >= totalFrames - 1
                      ? t.animation.replay
                      : t.animation.play}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((idx) => Math.max(0, idx - 1));
                }}
                disabled={safeIndex === 0}
                aria-label={t.animation.prevFrame}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.animation.prevFrame}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((idx) => Math.min(totalFrames - 1, idx + 1));
                }}
                disabled={safeIndex >= totalFrames - 1}
                aria-label={t.animation.nextFrame}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>{t.animation.nextFrame}</span>
                <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.animation.restart}</span>
              </button>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <span className="px-2 font-medium text-slate-500">
                  {t.animation.speedLabel}
                </span>
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSpeedMs(opt.ms)}
                    className={`rounded-md px-2 py-1 font-mono font-semibold transition-colors ${
                      speedMs === opt.ms
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{stageTitle}</span>
              <span className="font-mono tabular-nums">
                {t.animation.stepCounter
                  .replace("{current}", String(safeIndex + 1))
                  .replace("{total}", String(totalFrames))}
              </span>
            </div>
            <input
              type="range"
              aria-label={t.animation.timelineAriaLabel}
              min={0}
              max={totalFrames - 1}
              value={safeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setFrameIndex(Number(e.target.value));
              }}
              className="h-2 w-full cursor-pointer accent-slate-900"
            />

            {/* Stage Quick Jump Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {timeline.stages.map((st) => {
                const isCurrentStage = st.id === currentFrame.stage;
                const isCompletedStage =
                  st.stageNumber < currentFrame.stageNumber;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setFrameIndex(st.startIndex);
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      isCurrentStage
                        ? "border-slate-900 bg-slate-900 text-white"
                        : isCompletedStage
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {lang === "id" ? st.labelId : st.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active Calculation Spotlight (Contrast Legend + KaTeX Equation) */}
        <section
          aria-live="polite"
          className="rounded-xl border-2 border-slate-900 bg-white p-5 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.animation.activeOperationLabel}
              </div>
              <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                {opTitle}
              </h3>
            </div>

            {/* Contrast Key Pills: [A], [B], [Hasil] */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-lg border-2 border-amber-500 bg-slate-900 px-3 py-1.5 text-white">
                <span className="rounded bg-amber-500 px-1 font-mono text-[10px] font-bold text-slate-950">
                  A
                </span>
                <span className="text-slate-300">
                  {lang === "id"
                    ? currentFrame.operandALabelId
                    : currentFrame.operandALabelEn}
                  :
                </span>
                <span className="font-mono font-bold">
                  {currentFrame.operandAValue}
                </span>
              </div>

              {currentFrame.operandBValue && (
                <div className="flex items-center gap-1.5 rounded-lg border-2 border-amber-600 bg-amber-100 px-3 py-1.5 text-amber-950">
                  <span className="rounded bg-amber-600 px-1 font-mono text-[10px] font-bold text-white">
                    B
                  </span>
                  <span className="font-medium">
                    {lang === "id"
                      ? currentFrame.operandBLabelId
                      : currentFrame.operandBLabelEn}
                    :
                  </span>
                  <span className="font-mono font-bold">
                    {currentFrame.operandBValue}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 rounded-lg border-2 border-emerald-500 bg-emerald-700 px-3 py-1.5 text-white">
                <span className="rounded bg-emerald-200 px-1 font-mono text-[10px] font-bold text-emerald-950">
                  =
                </span>
                <span className="text-emerald-100">
                  {lang === "id"
                    ? currentFrame.resultLabelId
                    : currentFrame.resultLabelEn}
                  :
                </span>
                <span className="font-mono font-bold">
                  {currentFrame.resultValue}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
            <MathBlock tex={currentFrame.formulaLatex} displayMode />
          </div>

          <p className="mt-3 text-sm text-slate-600">{explanation}</p>
        </section>

        {/* Stage Synchronized Left-Right Matrix Panels */}
        <motion.div
          key={`anim-stage-${currentFrame.stage}`}
          initial={{ opacity: 0.7, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-6 xl:grid-cols-2"
        >
          {/* STAGE 1: X -> N */}
          {currentFrame.stage === "normalize" && currentFrame.activeNormCell && (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.animation.sourceMatrixXTitle}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t.animation.operandContrastHint}
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-2.5 py-2 text-left">Alt</th>
                        {model.criteria.map((c, j) => {
                          const isColActive =
                            j === currentFrame.activeNormCell!.j;
                          const stat = result.columnStats[j];
                          const isBenefit = c.type === "benefit";
                          return (
                            <th
                              key={c.id}
                              className={`px-2.5 py-2 text-right font-mono transition-opacity ${
                                isColActive
                                  ? "bg-amber-100 text-amber-950 ring-2 ring-inset ring-amber-600"
                                  : "text-slate-500 opacity-40"
                              }`}
                            >
                              <div>{c.id}</div>
                              <div className="text-[10px] font-normal">
                                {isBenefit
                                  ? `max=${formatNum(stat.max, 2)}`
                                  : `min=${formatNum(stat.min, 2)}`}
                                {isColActive && (
                                  <span className="ml-1 rounded bg-amber-600 px-1 text-[9px] font-bold text-white">
                                    {isBenefit ? "B" : "A"}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {model.alternatives.map((alt, i) => (
                        <tr key={alt.id}>
                          <td
                            className={`px-2.5 py-2 font-sans font-medium ${
                              i === currentFrame.activeNormCell!.i
                                ? "font-bold text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {alt.id}
                          </td>
                          {model.criteria.map((c, j) => {
                            const isActiveCell =
                              i === currentFrame.activeNormCell!.i &&
                              j === currentFrame.activeNormCell!.j;
                            const isBenefit = c.type === "benefit";
                            return (
                              <td key={c.id} className="p-1.5 text-right">
                                <div
                                  className={`rounded px-2 py-1.5 transition-all ${
                                    isActiveCell
                                      ? isBenefit
                                        ? "bg-slate-900 font-bold text-white ring-2 ring-amber-500"
                                        : "bg-amber-100 font-bold text-amber-950 ring-2 ring-amber-600"
                                      : "bg-slate-50 text-slate-500 opacity-35"
                                  }`}
                                >
                                  {isActiveCell && (
                                    <span
                                      className={`mr-1 rounded px-1 text-[9px] font-bold ${
                                        isBenefit
                                          ? "bg-amber-500 text-slate-950"
                                          : "bg-amber-600 text-white"
                                      }`}
                                    >
                                      {isBenefit ? "A" : "B"}
                                    </span>
                                  )}
                                  {formatNum(result.decisionMatrix[i][j], 2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.animation.targetMatrixNTitle}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t.animation.targetProgressHint}
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-2.5 py-2 text-left">Alt</th>
                        {model.criteria.map((c) => (
                          <th key={c.id} className="px-2.5 py-2 text-right font-mono">
                            {c.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {model.alternatives.map((alt, i) => (
                        <tr key={alt.id}>
                          <td className="px-2.5 py-2 font-sans font-medium text-slate-800">
                            {alt.id}
                          </td>
                          {model.criteria.map((c, j) => {
                            const isTarget =
                              i === currentFrame.activeNormCell!.i &&
                              j === currentFrame.activeNormCell!.j;
                            const revealed = isCellRevealed(
                              i,
                              j,
                              currentFrame.revealedNormCount,
                            );
                            return (
                              <td key={c.id} className="p-1.5 text-right">
                                <div
                                  className={`rounded px-2 py-1.5 transition-all ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : revealed
                                        ? "bg-slate-100 text-slate-900"
                                        : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed
                                    ? formatNum(
                                        result.normalizedMatrix[i][j],
                                        decimals,
                                      )
                                    : "..."}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* STAGE 2: w_j x N -> R */}
          {currentFrame.stage === "weighted" &&
            currentFrame.activeWeightedCell && (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.sourceWeightsAndNTitle}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.animation.operandContrastHint}
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2.5 py-2 text-left">Alt</th>
                          {model.criteria.map((c, j) => {
                            const isWeightActive =
                              j === currentFrame.activeWeightedCell!.j;
                            return (
                              <th
                                key={c.id}
                                className={`px-2.5 py-2 text-right font-mono transition-all ${
                                  isWeightActive
                                    ? "bg-slate-900 text-white ring-2 ring-inset ring-amber-500"
                                    : "text-slate-500 opacity-40"
                                }`}
                              >
                                <div>
                                  {isWeightActive && (
                                    <span className="mr-1 rounded bg-amber-500 px-1 text-[9px] font-bold text-slate-950">
                                      A
                                    </span>
                                  )}
                                  {c.id}
                                </div>
                                <div className="text-[10px] font-normal">
                                  w={formatNum(c.weight, 4)}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => (
                          <tr key={alt.id}>
                            <td
                              className={`px-2.5 py-2 font-sans font-medium ${
                                i === currentFrame.activeWeightedCell!.i
                                  ? "font-bold text-slate-900"
                                  : "text-slate-400"
                              }`}
                            >
                              {alt.id}
                            </td>
                            {model.criteria.map((c, j) => {
                              const isActiveCell =
                                i === currentFrame.activeWeightedCell!.i &&
                                j === currentFrame.activeWeightedCell!.j;
                              return (
                                <td key={c.id} className="p-1.5 text-right">
                                  <div
                                    className={`rounded px-2 py-1.5 transition-all ${
                                      isActiveCell
                                        ? "bg-amber-100 font-bold text-amber-950 ring-2 ring-amber-600"
                                        : "bg-slate-50 text-slate-500 opacity-35"
                                    }`}
                                  >
                                    {isActiveCell && (
                                      <span className="mr-1 rounded bg-amber-600 px-1 text-[9px] font-bold text-white">
                                        B
                                      </span>
                                    )}
                                    {formatNum(
                                      result.normalizedMatrix[i][j],
                                      decimals,
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.targetMatrixRTitle}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.animation.targetProgressHint}
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2.5 py-2 text-left">Alt</th>
                          {model.criteria.map((c) => (
                            <th key={c.id} className="px-2.5 py-2 text-right font-mono">
                              {c.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => (
                          <tr key={alt.id}>
                            <td className="px-2.5 py-2 font-sans font-medium text-slate-800">
                              {alt.id}
                            </td>
                            {model.criteria.map((c, j) => {
                              const isTarget =
                                i === currentFrame.activeWeightedCell!.i &&
                                j === currentFrame.activeWeightedCell!.j;
                              const revealed = isCellRevealed(
                                i,
                                j,
                                currentFrame.revealedWeightedCount,
                              );
                              return (
                                <td key={c.id} className="p-1.5 text-right">
                                  <div
                                    className={`rounded px-2 py-1.5 transition-all ${
                                      isTarget
                                        ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                        : revealed
                                          ? "bg-slate-100 text-slate-900"
                                          : "bg-slate-50 text-slate-300"
                                    }`}
                                  >
                                    {revealed
                                      ? formatNum(
                                          result.weightedNormalizedMatrix[i][j],
                                          decimals,
                                        )
                                      : "..."}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {/* STAGE 3: R -> NS */}
          {currentFrame.stage === "ns" &&
            currentFrame.activeNsCol !== undefined && (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.sourceColumnRTitle}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.animation.operandContrastHint}
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2.5 py-2 text-left">Alt</th>
                          {model.criteria.map((c, j) => (
                            <th
                              key={c.id}
                              className={`px-2.5 py-2 text-right font-mono ${
                                j === currentFrame.activeNsCol
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-400 opacity-40"
                              }`}
                            >
                              {c.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => (
                          <tr key={alt.id}>
                            <td className="px-2.5 py-2 font-sans font-medium text-slate-800">
                              {alt.id}
                            </td>
                            {model.criteria.map((c, j) => {
                              const inCol = j === currentFrame.activeNsCol;
                              const val = result.weightedNormalizedMatrix[i][j];
                              const isMin =
                                inCol &&
                                Math.abs(val - result.negativeIdeal[j]) <= 1e-12;
                              return (
                                <td key={c.id} className="p-1.5 text-right">
                                  <div
                                    className={`rounded px-2 py-1.5 transition-all ${
                                      isMin
                                        ? "bg-amber-100 font-bold text-amber-950 ring-2 ring-amber-600"
                                        : inCol
                                          ? "bg-slate-900 font-medium text-white"
                                          : "bg-slate-50 text-slate-400 opacity-30"
                                    }`}
                                  >
                                    {formatNum(val, decimals)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.targetVectorNSTitle}
                  </h4>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {model.criteria.map((c) => (
                            <th key={c.id} className="px-3 py-2 text-right font-mono">
                              ns_{c.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-mono tabular-nums">
                        <tr>
                          {result.negativeIdeal.map((val, j) => {
                            const isTarget = j === currentFrame.activeNsCol;
                            const revealed = j < currentFrame.revealedNsCount;
                            return (
                              <td key={model.criteria[j].id} className="p-2 text-right">
                                <div
                                  className={`rounded px-2.5 py-2 transition-all ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : revealed
                                        ? "bg-slate-100 text-slate-900"
                                        : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed ? formatNum(val, decimals) : "..."}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {/* STAGE 4: R - NS -> E_i, T_i */}
          {currentFrame.stage === "distances" &&
            currentFrame.activeDistRow !== undefined && (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.sourceRowRAndNSTitle}
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2.5 py-2 text-left">Alt</th>
                          {model.criteria.map((c) => (
                            <th key={c.id} className="px-2.5 py-2 text-right font-mono">
                              {c.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => {
                          const isRowActive = i === currentFrame.activeDistRow;
                          return (
                            <tr key={alt.id}>
                              <td
                                className={`px-2.5 py-2 font-sans font-medium ${
                                  isRowActive
                                    ? "font-bold text-slate-900"
                                    : "text-slate-400"
                                }`}
                              >
                                {alt.id}
                              </td>
                              {model.criteria.map((c, j) => (
                                <td key={c.id} className="p-1 text-right">
                                  <div
                                    className={`rounded px-2 py-1.5 ${
                                      isRowActive
                                        ? "bg-slate-900 font-bold text-white ring-1 ring-amber-500"
                                        : "bg-slate-50 text-slate-400 opacity-35"
                                    }`}
                                  >
                                    {formatNum(
                                      result.weightedNormalizedMatrix[i][j],
                                      decimals,
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 border-amber-500 bg-amber-50">
                          <td className="px-2.5 py-2 font-sans font-bold text-amber-950">
                            NS [B]
                          </td>
                          {result.negativeIdeal.map((val, j) => (
                            <td key={model.criteria[j].id} className="p-1 text-right">
                              <div className="rounded bg-amber-100 px-2 py-1.5 font-bold text-amber-950 ring-1 ring-amber-600">
                                {formatNum(val, decimals)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.targetDistancesTitle}
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-left">Alt</th>
                          <th className="px-3 py-2 text-right">E_i</th>
                          <th className="px-3 py-2 text-right">T_i</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => {
                          const isTarget = i === currentFrame.activeDistRow;
                          const revealed = i < currentFrame.revealedDistCount;
                          return (
                            <tr key={alt.id}>
                              <td className="px-3 py-2 font-sans font-medium text-slate-800">
                                {alt.id}
                              </td>
                              <td className="p-1.5 text-right">
                                <div
                                  className={`rounded px-2.5 py-1.5 ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : revealed
                                        ? "bg-slate-100 text-slate-900"
                                        : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed
                                    ? formatNum(
                                        result.euclideanDistances[i],
                                        decimals,
                                      )
                                    : "..."}
                                </div>
                              </td>
                              <td className="p-1.5 text-right">
                                <div
                                  className={`rounded px-2.5 py-1.5 ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : revealed
                                        ? "bg-slate-100 text-slate-900"
                                        : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed
                                    ? formatNum(
                                        result.taxicabDistances[i],
                                        decimals,
                                      )
                                    : "..."}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {/* STAGE 5: RELATIVE PAIRS */}
          {currentFrame.stage === "relative" && currentFrame.activeRelPair && (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.sourcePairETTitle}
                  </h4>
                  <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                    tau = {model.tau}
                  </span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left">Alt</th>
                        <th className="px-3 py-2 text-right">E</th>
                        <th className="px-3 py-2 text-right">T</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {model.alternatives.map((alt, rIdx) => {
                        const isA = rIdx === currentFrame.activeRelPair!.i;
                        const isB = rIdx === currentFrame.activeRelPair!.k;
                        return (
                          <tr
                            key={alt.id}
                            className={
                              isA
                                ? "bg-slate-900 font-bold text-white"
                                : isB
                                  ? "bg-amber-100 font-bold text-amber-950"
                                  : "text-slate-400 opacity-35"
                            }
                          >
                            <td className="px-3 py-2.5 font-sans">
                              {isA && (
                                <span className="mr-1.5 rounded bg-amber-500 px-1 text-[10px] font-bold text-slate-950">
                                  A (i)
                                </span>
                              )}
                              {isB && (
                                <span className="mr-1.5 rounded bg-amber-600 px-1 text-[10px] font-bold text-white">
                                  B (k)
                                </span>
                              )}
                              {alt.id}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {formatNum(result.euclideanDistances[rIdx], decimals)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {formatNum(result.taxicabDistances[rIdx], decimals)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.animation.targetMatrixRelTitle}
                </h4>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-2 py-2 text-left">i / k</th>
                        {model.alternatives.map((a) => (
                          <th key={a.id} className="px-2 py-2 text-right font-mono">
                            {a.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {model.alternatives.map((altI, i) => (
                        <tr key={altI.id}>
                          <td className="px-2 py-2 font-semibold text-slate-800">
                            {altI.id}
                          </td>
                          {model.alternatives.map((altK, k) => {
                            const isDiag = i === k;
                            const isTarget =
                              i === currentFrame.activeRelPair!.i &&
                              k === currentFrame.activeRelPair!.k;
                            const ord = offDiagOrder(i, k);
                            const revealed =
                              isDiag || ord <= currentFrame.revealedRelPairsCount;
                            return (
                              <td key={altK.id} className="p-1 text-right">
                                <div
                                  className={`rounded px-1.5 py-1.5 ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : isDiag
                                        ? "bg-slate-100 text-slate-400"
                                        : revealed
                                          ? "bg-slate-100 text-slate-900"
                                          : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed
                                    ? formatNum(
                                        result.relativeAssessmentMatrix[i][k],
                                        decimals,
                                      )
                                    : "..."}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* STAGE 6: ASSESSMENT SCORE SUM */}
          {currentFrame.stage === "assessment" &&
            currentFrame.activeScoreRow !== undefined && (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.sourceRowRelTitle}
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2 py-2 text-left">i / k</th>
                          {model.alternatives.map((a) => (
                            <th key={a.id} className="px-2 py-2 text-right font-mono">
                              {a.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((altI, i) => {
                          const isRowActive = i === currentFrame.activeScoreRow;
                          return (
                            <tr key={altI.id}>
                              <td
                                className={`px-2 py-2 font-semibold ${
                                  isRowActive ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                {altI.id}
                              </td>
                              {model.alternatives.map((altK, k) => (
                                <td key={altK.id} className="p-1 text-right">
                                  <div
                                    className={`rounded px-1.5 py-1.5 ${
                                      isRowActive
                                        ? "bg-slate-900 font-bold text-white ring-1 ring-amber-500"
                                        : "bg-slate-50 text-slate-400 opacity-35"
                                    }`}
                                  >
                                    {formatNum(
                                      result.relativeAssessmentMatrix[i][k],
                                      decimals,
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.animation.targetScoreHTitle}
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-left">Alt</th>
                          <th className="px-3 py-2 text-right">H_i = sum_k h_ik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {model.alternatives.map((alt, i) => {
                          const isTarget = i === currentFrame.activeScoreRow;
                          const revealed = i < currentFrame.revealedScoreCount;
                          return (
                            <tr key={alt.id}>
                              <td className="px-3 py-2 font-sans font-medium text-slate-800">
                                {alt.id}: {lang === "id" ? alt.nameId : alt.nameEn}
                              </td>
                              <td className="p-1.5 text-right">
                                <div
                                  className={`rounded px-2.5 py-1.5 ${
                                    isTarget
                                      ? "bg-emerald-700 font-bold text-white ring-2 ring-emerald-400"
                                      : revealed
                                        ? "bg-slate-100 text-slate-900"
                                        : "bg-slate-50 text-slate-300"
                                  }`}
                                >
                                  {revealed
                                    ? formatNum(
                                        result.assessmentScores[i],
                                        decimals,
                                      )
                                    : "..."}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

          {/* STAGE 7: FINAL RANKING */}
          {currentFrame.stage === "ranking" && (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.animation.sourceUnsortedHTitle}
                </h4>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left">Alt</th>
                        <th className="px-3 py-2 text-right">E_i</th>
                        <th className="px-3 py-2 text-right">T_i</th>
                        <th className="px-3 py-2 text-right">H_i</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {model.alternatives.map((alt, i) => {
                        const isA = i === currentFrame.activeScoreRow;
                        return (
                          <tr
                            key={alt.id}
                            className={
                              isA
                                ? "bg-slate-900 font-bold text-white"
                                : "text-slate-500 opacity-50"
                            }
                          >
                            <td className="px-3 py-2 font-sans">
                              {alt.id}: {lang === "id" ? alt.nameId : alt.nameEn}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNum(result.euclideanDistances[i], decimals)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNum(result.taxicabDistances[i], decimals)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNum(result.assessmentScores[i], decimals)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900">
                  {t.animation.targetRankingTitle}
                </h4>
                <div className="mt-3 space-y-2">
                  {result.ranking.map((item, pos) => {
                    const alt = model.alternatives.find(
                      (a) => a.id === item.alternativeId,
                    )!;
                    const isTarget = pos === currentFrame.activeRankPos;
                    const revealed = pos < currentFrame.revealedRankCount;
                    return (
                      <div
                        key={item.alternativeId}
                        className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs transition-all ${
                          isTarget
                            ? "border-emerald-500 bg-emerald-700 font-bold text-white ring-2 ring-emerald-300"
                            : revealed
                              ? "border-slate-200 bg-slate-50 text-slate-900"
                              : "border-slate-100 bg-slate-50/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold">
                            #{item.rank}
                          </span>
                          <span>
                            {revealed
                              ? `${alt.id}: ${lang === "id" ? alt.nameId : alt.nameEn}`
                              : "..."}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums">
                          {revealed ? `H = ${formatNum(item.score, decimals)}` : "..."}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </motion.div>
      </div>
    </MotionConfig>
  );
}


import { AlertCircle, Award, Info } from "lucide-react";
import {
  buildRankingExplanation,
  formatNum,
} from "../domain/codas/formatCalculationTrace";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";

interface FinalRankingPageProps {
  model: CodasModel;
  result: CodasResult | null;
  lang: Language;
  decimals: number;
}

export function FinalRankingPage({
  model,
  result,
  lang,
  decimals,
}: FinalRankingPageProps) {
  const t = TRANSLATIONS[lang];

  if (!result) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900"
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <h2>{t.ranking.heading}</h2>
        </div>
        <p className="mt-2 text-sm">{t.ranking.invalidBlocked}</p>
      </div>
    );
  }

  const top = result.ranking[0];
  const topAlt = top
    ? model.alternatives.find((a) => a.id === top.alternativeId)
    : undefined;
  const hasTies = result.ranking.some((r) => r.tieGroupSize > 1);
  const maxAbsScore = Math.max(
    1e-9,
    ...result.ranking.map((r) => Math.abs(r.score)),
  );
  const explanation = buildRankingExplanation(model, result, lang, decimals);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {t.ranking.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t.ranking.subheading}</p>

        {top && topAlt && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <Award className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    {t.ranking.winnerBannerLabel}
                  </div>
                  <div className="text-lg font-bold text-emerald-950">
                    {topAlt.id}: {lang === "id" ? topAlt.nameId : topAlt.nameEn}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-medium text-emerald-800">
                  {t.ranking.assessmentScoreLabel}
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-emerald-950">
                  {formatNum(top.score, decimals)}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-emerald-200/80 pt-3">
              <div className="text-xs font-semibold text-emerald-900">
                {t.ranking.explanationTitle}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-emerald-950">
                {explanation}
              </p>
            </div>
          </div>
        )}

        {hasTies && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.ranking.tieNotice}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranked Table */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900">
            {t.ranking.tableTitle}
          </h3>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{t.ranking.tableTitle}</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2.5">{t.common.rank}</th>
                  <th className="px-3 py-2.5">{t.common.alternative}</th>
                  <th className="px-3 py-2.5 text-right">E_i</th>
                  <th className="px-3 py-2.5 text-right">T_i</th>
                  <th className="px-3 py-2.5 text-right">H_i</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.ranking.map((item) => {
                  const alt = model.alternatives.find(
                    (a) => a.id === item.alternativeId,
                  )!;
                  const isFirst = item.rank === 1;
                  return (
                    <tr
                      key={item.alternativeId}
                      className={
                        isFirst ? "bg-emerald-50/50 font-medium" : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                            isFirst
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          #{item.rank}
                          {isFirst && (
                            <span className="font-sans font-semibold">
                              {t.ranking.preferredLabel}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-900">
                        <span className="font-mono text-xs text-slate-500">
                          {alt.id}
                        </span>{" "}
                        {lang === "id" ? alt.nameId : alt.nameEn}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {formatNum(item.euclidean, decimals)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {formatNum(item.taxicab, decimals)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-bold tabular-nums text-slate-900">
                        {formatNum(item.score, decimals)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Diverging Bar Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900">
            {t.ranking.chartTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            tau = {model.tau} | {t.ranking.assessmentScoreLabel}
          </p>

          <div className="mt-5 space-y-4">
            {result.ranking.map((item) => {
              const alt = model.alternatives.find(
                (a) => a.id === item.alternativeId,
              )!;
              const pct = (Math.abs(item.score) / maxAbsScore) * 50;
              const isNonNeg = item.score >= 0;

              return (
                <div key={item.alternativeId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      <span className="font-mono text-slate-500">
                        #{item.rank} {alt.id}
                      </span>{" "}
                      {lang === "id" ? alt.nameId : alt.nameEn}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatNum(item.score, decimals)}
                    </span>
                  </div>

                  {/* Centered zero axis */}
                  <div className="relative h-5 w-full overflow-hidden rounded bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-1/2 w-px bg-slate-400"
                      aria-hidden="true"
                    />
                    {isNonNeg ? (
                      <div
                        className="absolute inset-y-1 left-1/2 rounded-r bg-emerald-600 transition-all duration-300"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    ) : (
                      <div
                        className="absolute inset-y-1 rounded-l bg-rose-500 transition-all duration-300"
                        style={{
                          right: "50%",
                          width: `${Math.max(pct, 0.5)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Score Derivation Breakdown (Provenance) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900">
          {lang === "id"
            ? "Jejak Asal Perhitungan Nilai (Dari Tahap Sebelumnya)"
            : "Score Derivation Trace (From Intermediate Steps)"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {lang === "id"
            ? "Rincian sumber angka E_i, T_i (Langkah 5), dan H_i (Langkah 6-7) untuk memudahkan penjelasan hasil."
            : "Exact origin of E_i, T_i (Step 5), and H_i (Steps 6-7) to support clear explanation."}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2.5">{t.common.rank}</th>
                <th className="px-3 py-2.5">{t.common.alternative}</th>
                <th className="px-3 py-2.5">
                  {lang === "id" ? "Asal E_i = sqrt(sum (r_ij - ns_j)^2)" : "Source of E_i"}
                </th>
                <th className="px-3 py-2.5">
                  {lang === "id" ? "Asal T_i = sum |r_ij - ns_j|" : "Source of T_i"}
                </th>
                <th className="px-3 py-2.5">
                  {lang === "id" ? "Asal H_i = sum_k h_ik" : "Source of H_i"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {result.ranking.map((item) => {
                const altIdx = model.alternatives.findIndex(
                  (a) => a.id === item.alternativeId,
                );
                const alt = model.alternatives[altIdx];
                const bd = result.distanceBreakdowns[altIdx];
                const sumSq = bd.perCriterionSquaredDiff.reduce(
                  (s, v) => s + v,
                  0,
                );
                const absSumExpr = bd.perCriterionAbsDiff
                  .map((v) => formatNum(v, decimals))
                  .join(" + ");
                const hSumExpr = result.relativeAssessmentMatrix[altIdx]
                  .map((v) => formatNum(v, decimals))
                  .join(" + ");

                return (
                  <tr key={item.alternativeId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      #{item.rank}
                    </td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-900">
                      <span className="font-mono text-slate-500">{alt.id}</span>{" "}
                      {lang === "id" ? alt.nameId : alt.nameEn}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      sqrt({formatNum(sumSq, decimals)}) ={" "}
                      <span className="font-semibold text-slate-900">
                        {formatNum(item.euclidean, decimals)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {absSumExpr} ={" "}
                      <span className="font-semibold text-slate-900">
                        {formatNum(item.taxicab, decimals)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {hSumExpr} ={" "}
                      <span className="font-semibold text-slate-900">
                        {formatNum(item.score, decimals)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


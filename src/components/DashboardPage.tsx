import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  FileDown,
  Layers,
  Sliders,
} from "lucide-react";
import { formatNum } from "../domain/codas/formatCalculationTrace";
import { JOURNAL_REFERENCE } from "../domain/codas/preset";
import type {
  CodasModel,
  CodasResult,
  Language,
  ValidationResult,
} from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";
import { CriterionBadge } from "./CriterionBadge";

export type AppPage =
  | "dashboard"
  | "builder"
  | "walkthrough"
  | "animation"
  | "ranking"
  | "reports";

interface DashboardPageProps {
  model: CodasModel;
  validation: ValidationResult;
  result: CodasResult | null;
  lang: Language;
  decimals: number;
  isPreset: boolean;
  onNavigate: (page: AppPage) => void;
}

export function DashboardPage({
  model,
  validation,
  result,
  lang,
  decimals,
  isPreset,
  onNavigate,
}: DashboardPageProps) {
  const t = TRANSLATIONS[lang];
  const topRank = result?.ranking[0];
  const topAlt = topRank
    ? model.alternatives.find((a) => a.id === topRank.alternativeId)
    : undefined;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {t.dashboard.heading}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {t.dashboard.subheading}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              isPreset
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-indigo-200 bg-indigo-50 text-indigo-800"
            }`}
          >
            {isPreset ? t.modelStatus.presetBadge : t.modelStatus.customBadge}
          </span>
        </div>

        {!validation.valid && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.dashboard.invalidModelNotice}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-medium text-slate-500">
              {t.dashboard.criteriaCount}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {model.criteria.length}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-medium text-slate-500">
              {t.dashboard.alternativesCount}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {model.alternatives.length}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-medium text-slate-500">
              {t.dashboard.totalWeightLabel}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {formatNum(validation.totalWeight, 2)}
              </span>
              {Math.abs(validation.totalWeight - 1) <= 1e-6 ? (
                <CheckCircle2
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="h-4 w-4 text-rose-600"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-medium text-slate-500">
              {t.dashboard.tauLabel}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
              {model.tau}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.dashboard.bestAlternativeLabel}</span>
            </div>
            <div className="mt-1 text-lg font-bold text-emerald-950">
              {topAlt && topRank
                ? `${topAlt.id}: ${lang === "id" ? topAlt.nameId : topAlt.nameEn}`
                : "-"}
            </div>
            <div className="mt-0.5 font-mono text-xs tabular-nums text-emerald-800">
              {topRank
                ? `H = ${formatNum(topRank.score, decimals)}`
                : t.common.noData}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {t.dashboard.summaryTableTitle}
            </h3>
            <span className="text-xs text-slate-500">
              {isPreset
                ? t.dashboard.presetIndicator
                : t.dashboard.customIndicator}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                {t.dashboard.summaryTableTitle}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2.5">{t.common.id}</th>
                  <th className="px-3 py-2.5">{t.common.criterion}</th>
                  <th className="px-3 py-2.5">{t.common.type}</th>
                  <th className="px-3 py-2.5 text-right">{t.common.weight}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {model.criteria.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-700">
                      {c.id}
                    </td>
                    <td className="px-3 py-2.5 text-slate-900">
                      <div className="font-medium">
                        {lang === "id" ? c.nameId : c.nameEn}
                      </div>
                      <div className="text-xs text-slate-500">
                        {lang === "id" ? c.nameEn : c.nameId}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <CriterionBadge type={c.type} lang={lang} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {formatNum(c.weight, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900">
              {t.dashboard.quickActionsTitle}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate("builder")}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>{t.dashboard.openBuilder}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("walkthrough")}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>{t.dashboard.openWalkthrough}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("ranking")}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  <span>{t.dashboard.openRanking}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("reports")}
                className="flex items-center justify-between rounded-lg border border-slate-900 bg-slate-900 px-3.5 py-2.5 text-left text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  <span>{t.dashboard.openReports}</span>
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <h3>{t.dashboard.overviewTitle}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {t.dashboard.overviewBody}
            </p>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold text-slate-800">
                {t.dashboard.referenceTitle}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {t.dashboard.referenceNote}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-500">
                {lang === "id"
                  ? JOURNAL_REFERENCE.citationId
                  : JOURNAL_REFERENCE.citationEn}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


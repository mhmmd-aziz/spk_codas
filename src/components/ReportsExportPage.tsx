import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
} from "lucide-react";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";
import { exportCodasExcel } from "../export/exportExcel";
import { exportCodasPdf, type PdfExportLanguage } from "../export/exportPdf";
import { exportCodasWord, type WordExportLanguage } from "../export/exportWord";
import { TRANSLATIONS } from "../i18n/translations";

type ExportLangSelection = "current" | "id" | "en" | "bilingual";

interface ReportsExportPageProps {
  model: CodasModel;
  result: CodasResult | null;
  lang: Language;
  decimals: number;
}

export function ReportsExportPage({
  model,
  result,
  lang,
  decimals,
}: ReportsExportPageProps) {
  const t = TRANSLATIONS[lang];
  const [exportLangChoice, setExportLangChoice] =
    useState<ExportLangSelection>("current");
  const [busyPdf, setBusyPdf] = useState(false);
  const [busyWord, setBusyWord] = useState(false);
  const [busyExcel, setBusyExcel] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resolvedPdfLang: PdfExportLanguage =
    exportLangChoice === "current" ? lang : exportLangChoice;
  const resolvedWordLang: WordExportLanguage =
    exportLangChoice === "current" ? lang : exportLangChoice;
  const resolvedExcelLang: Language =
    exportLangChoice === "current"
      ? lang
      : exportLangChoice === "bilingual"
        ? lang
        : exportLangChoice;

  const handleDownloadPdf = async () => {
    if (!result) return;
    setBusyPdf(true);
    setStatusMessage(null);
    try {
      exportCodasPdf(model, result, resolvedPdfLang, decimals);
      setStatusMessage({ type: "success", text: t.reports.pdfSuccess });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `${t.reports.exportErrorPrefix}${msg}`,
      });
    } finally {
      setBusyPdf(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!result) return;
    setBusyWord(true);
    setStatusMessage(null);
    try {
      await exportCodasWord(model, result, resolvedWordLang, decimals);
      setStatusMessage({ type: "success", text: t.reports.wordSuccess });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `${t.reports.exportErrorPrefix}${msg}`,
      });
    } finally {
      setBusyWord(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!result) return;
    setBusyExcel(true);
    setStatusMessage(null);
    try {
      await exportCodasExcel(model, resolvedExcelLang);
      setStatusMessage({ type: "success", text: t.reports.excelSuccess });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `${t.reports.exportErrorPrefix}${msg}`,
      });
    } finally {
      setBusyExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {t.reports.heading}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t.reports.subheading}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="export-lang-select"
              className="text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {t.reports.exportLanguageLabel}
            </label>
            <select
              id="export-lang-select"
              value={exportLangChoice}
              onChange={(e) =>
                setExportLangChoice(e.target.value as ExportLangSelection)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              <option value="current">{t.reports.exportLangCurrent}</option>
              <option value="id">{t.reports.exportLangId}</option>
              <option value="en">{t.reports.exportLangEn}</option>
              <option value="bilingual">
                {t.reports.exportLangBilingualPdf}
              </option>
            </select>
          </div>
        </div>

        {!result && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.reports.invalidBlocked}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className={`mt-4 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm ${
              statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* PDF Card */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t.reports.pdfCardTitle}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t.reports.pdfCardDesc}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              {t.reports.pdfIncludes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!result || busyPdf}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{t.reports.downloadPdf}</span>
            </button>
          </div>
        </section>

        {/* Word Card */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <FileCode2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t.reports.wordCardTitle}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t.reports.wordCardDesc}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              {t.reports.wordIncludes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleDownloadWord}
              disabled={!result || busyWord}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyWord ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileCode2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{t.reports.downloadWord}</span>
            </button>
          </div>
        </section>

        {/* Excel Card */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t.reports.excelCardTitle}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {t.reports.excelCardDesc}
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              {t.reports.excelIncludes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={!result || busyExcel}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{t.reports.downloadExcel}</span>
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t.reports.formulaGuaranteeTitle}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {t.reports.formulaGuaranteeBody}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


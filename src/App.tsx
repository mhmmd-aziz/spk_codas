import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Calculator,
  FileDown,
  Globe,
  LayoutDashboard,
  Menu,
  Sliders,
  X,
} from "lucide-react";
import { CalculationWalkthroughPage } from "./components/CalculationWalkthroughPage";
import { DashboardPage, type AppPage } from "./components/DashboardPage";
import { FinalRankingPage } from "./components/FinalRankingPage";
import { ModelBuilderPage } from "./components/ModelBuilderPage";
import { ReportsExportPage } from "./components/ReportsExportPage";
import { calculateCodas } from "./domain/codas/calculateCodas";
import { createJournalPresetModel } from "./domain/codas/preset";
import type { CodasModel, Language } from "./domain/codas/types";
import { TRANSLATIONS } from "./i18n/translations";

const LANG_STORAGE_KEY = "codas_dss_language";

function readInitialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "id" || saved === "en") return saved;
  } catch {
    // Ignore storage errors in restricted environments
  }
  return "id";
}

function modelsMatch(a: CodasModel, b: CodasModel): boolean {
  if (a.tau !== b.tau) return false;
  if (a.criteria.length !== b.criteria.length) return false;
  if (a.alternatives.length !== b.alternatives.length) return false;
  for (let j = 0; j < a.criteria.length; j++) {
    const ca = a.criteria[j];
    const cb = b.criteria[j];
    if (
      ca.id !== cb.id ||
      ca.nameId !== cb.nameId ||
      ca.nameEn !== cb.nameEn ||
      ca.weight !== cb.weight ||
      ca.type !== cb.type
    ) {
      return false;
    }
  }
  for (let i = 0; i < a.alternatives.length; i++) {
    const aa = a.alternatives[i];
    const ab = b.alternatives[i];
    if (aa.id !== ab.id || aa.nameId !== ab.nameId || aa.nameEn !== ab.nameEn) {
      return false;
    }
    for (const c of a.criteria) {
      if (aa.values[c.id] !== ab.values[c.id]) return false;
    }
  }
  return true;
}

export function App() {
  const [lang, setLang] = useState<Language>(readInitialLanguage);
  const [decimals, setDecimals] = useState<number>(4);
  const [page, setPage] = useState<AppPage>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [model, setModel] = useState<CodasModel>(() => createJournalPresetModel());
  const [modelRevision, setModelRevision] = useState<number>(1);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  }, [lang]);

  const handleUpdateModel = useCallback(
    (updater: (prev: CodasModel) => CodasModel) => {
      setModel((prev) => updater(prev));
      setModelRevision((rev) => rev + 1);
    },
    [],
  );

  const handleResetPreset = useCallback(() => {
    setModel(createJournalPresetModel());
    setModelRevision((rev) => rev + 1);
  }, []);

  const evaluation = useMemo(() => calculateCodas(model), [model]);
  const presetBaseline = useMemo(() => createJournalPresetModel(), []);
  const isPreset = useMemo(
    () => modelsMatch(model, presetBaseline),
    [model, presetBaseline],
  );

  const navItems: Array<{
    key: AppPage;
    label: string;
    icon: typeof LayoutDashboard;
  }> = [
    { key: "dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { key: "builder", label: t.nav.modelBuilder, icon: Sliders },
    { key: "walkthrough", label: t.nav.calculation, icon: Calculator },
    { key: "ranking", label: t.nav.ranking, icon: Award },
    { key: "reports", label: t.nav.reports, icon: FileDown },
  ];

  const activeNavItem = navItems.find((item) => item.key === page) ?? navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-5">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              {t.appTitle}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t.appSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setPage(item.key);
                  setMobileSidebarOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                <span
                  className={`font-mono text-[11px] ${
                    active ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  0{idx + 1}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2.5 border-t border-slate-200 bg-slate-50/70 px-4 py-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <label
              htmlFor="decimals-select"
              className="font-medium text-slate-600"
            >
              {t.precisionLabel}
            </label>
            <select
              id="decimals-select"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className="bg-transparent font-mono font-semibold text-slate-900 focus:outline-none"
            >
              <option value={2}>2 {t.decimalsUnit}</option>
              <option value={4}>4 {t.decimalsUnit}</option>
              <option value={6}>6 {t.decimalsUnit}</option>
            </select>
          </div>

          <div
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
            role="group"
            aria-label={t.languageLabel}
          >
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Globe className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              {t.languageLabel}
            </span>
            <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setLang("id")}
                aria-pressed={lang === "id"}
                className={`rounded px-2 py-0.5 font-medium transition-colors ${
                  lang === "id"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={`rounded px-2 py-0.5 font-medium transition-colors ${
                  lang === "en"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {activeNavItem.label}
            </p>
            <p className="truncate text-xs text-slate-500">{t.appTitle}</p>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {page === "dashboard" && (
            <DashboardPage
              model={model}
              validation={evaluation.validation}
              result={evaluation.result}
              lang={lang}
              decimals={decimals}
              isPreset={isPreset}
              onNavigate={setPage}
            />
          )}

          {page === "builder" && (
            <ModelBuilderPage
              model={model}
              validation={evaluation.validation}
              lang={lang}
              isPreset={isPreset}
              onUpdateModel={handleUpdateModel}
              onResetPreset={handleResetPreset}
            />
          )}

          {page === "walkthrough" && (
            <CalculationWalkthroughPage
              model={model}
              result={evaluation.result}
              lang={lang}
              decimals={decimals}
              modelRevision={modelRevision}
            />
          )}

          {page === "ranking" && (
            <FinalRankingPage
              model={model}
              result={evaluation.result}
              lang={lang}
              decimals={decimals}
            />
          )}

          {page === "reports" && (
            <ReportsExportPage
              model={model}
              result={evaluation.result}
              lang={lang}
              decimals={decimals}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;


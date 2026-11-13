import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Trash2,
  X,
} from "lucide-react";
import { formatNum } from "../domain/codas/formatCalculationTrace";
import { WEIGHT_SUM_TOLERANCE } from "../domain/codas/preset";
import type {
  Alternative,
  CodasModel,
  Criterion,
  CriterionType,
  Language,
  ValidationResult,
} from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";
import { ConfirmDialog } from "./ConfirmDialog";
import { CriterionBadge } from "./CriterionBadge";

type BuilderTab = "criteria" | "alternatives" | "matrix";

interface ModelBuilderPageProps {
  model: CodasModel;
  validation: ValidationResult;
  lang: Language;
  isPreset: boolean;
  onUpdateModel: (updater: (prev: CodasModel) => CodasModel) => void;
  onResetPreset: () => void;
}

function nextUniqueId(prefix: string, existingIds: string[]): string {
  const set = new Set(existingIds);
  let num = existingIds.length + 1;
  while (set.has(`${prefix}${num}`)) {
    num++;
  }
  return `${prefix}${num}`;
}

interface CriterionDialogState {
  mode: "add" | "edit";
  criterionId?: string;
  nameId: string;
  nameEn: string;
  weightStr: string;
  type: CriterionType;
  descriptionId: string;
  descriptionEn: string;
  altValues: Record<string, string>;
  formError: string | null;
}

interface AlternativeDialogState {
  mode: "add" | "edit";
  alternativeId?: string;
  nameId: string;
  nameEn: string;
  critValues: Record<string, string>;
  formError: string | null;
}

export function ModelBuilderPage({
  model,
  validation,
  lang,
  isPreset,
  onUpdateModel,
  onResetPreset,
}: ModelBuilderPageProps) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<BuilderTab>("criteria");

  // Draft string for tau so user can freely type decimals like "0.0"
  const [tauDraft, setTauDraft] = useState<string | null>(null);
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});

  // Dialog states
  const [criterionDialog, setCriterionDialog] = useState<CriterionDialogState | null>(
    null,
  );
  const [alternativeDialog, setAlternativeDialog] =
    useState<AlternativeDialogState | null>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [deleteCriterionTarget, setDeleteCriterionTarget] = useState<Criterion | null>(
    null,
  );
  const [deleteAlternativeTarget, setDeleteAlternativeTarget] =
    useState<Alternative | null>(null);

  const totalWeight = validation.totalWeight;
  const weightIsExact = Math.abs(totalWeight - 1) <= WEIGHT_SUM_TOLERANCE;

  const handleNormalizeWeights = () => {
    onUpdateModel((prev) => {
      const nonNegWeights = prev.criteria.map((c) =>
        Number.isFinite(c.weight) && c.weight > 0 ? c.weight : 0,
      );
      const sum = nonNegWeights.reduce((a, b) => a + b, 0);
      const nextCriteria = prev.criteria.map((c, idx) => {
        const normalized =
          sum > 0
            ? Number((nonNegWeights[idx] / sum).toFixed(6))
            : Number((1 / prev.criteria.length).toFixed(6));
        return { ...c, weight: normalized };
      });
      // Adjust first criterion slightly if rounding left tiny drift
      if (nextCriteria.length > 0) {
        const currentSum = nextCriteria.reduce((a, c) => a + c.weight, 0);
        const drift = 1 - currentSum;
        nextCriteria[0] = {
          ...nextCriteria[0],
          weight: Number((nextCriteria[0].weight + drift).toFixed(6)),
        };
      }
      return { ...prev, criteria: nextCriteria };
    });
    setWeightDrafts({});
  };

  const handleMoveCriterion = (index: number, delta: -1 | 1) => {
    onUpdateModel((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.criteria.length) return prev;
      const copy = [...prev.criteria];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return { ...prev, criteria: copy };
    });
  };

  const handleMoveAlternative = (index: number, delta: -1 | 1) => {
    onUpdateModel((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.alternatives.length) return prev;
      const copy = [...prev.alternatives];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return { ...prev, alternatives: copy };
    });
  };

  const openAddCriterion = () => {
    const altValues: Record<string, string> = {};
    model.alternatives.forEach((a) => {
      altValues[a.id] = "";
    });
    setCriterionDialog({
      mode: "add",
      nameId: "",
      nameEn: "",
      weightStr: "0.00",
      type: "benefit",
      descriptionId: "",
      descriptionEn: "",
      altValues,
      formError: null,
    });
  };

  const openEditCriterion = (c: Criterion) => {
    setCriterionDialog({
      mode: "edit",
      criterionId: c.id,
      nameId: c.nameId,
      nameEn: c.nameEn,
      weightStr: String(c.weight),
      type: c.type,
      descriptionId: c.descriptionId ?? "",
      descriptionEn: c.descriptionEn ?? "",
      altValues: {},
      formError: null,
    });
  };

  const submitCriterionDialog = () => {
    if (!criterionDialog) return;
    const nameId = criterionDialog.nameId.trim();
    const nameEn = criterionDialog.nameEn.trim();
    const weight = Number(criterionDialog.weightStr);

    if (!nameId || !nameEn) {
      setCriterionDialog({
        ...criterionDialog,
        formError:
          lang === "id"
            ? "Nama kriteria Bahasa Indonesia dan English wajib diisi."
            : "Both Indonesian and English criterion names are required.",
      });
      return;
    }
    if (!Number.isFinite(weight) || weight < 0) {
      setCriterionDialog({
        ...criterionDialog,
        formError:
          lang === "id"
            ? "Bobot harus berupa angka >= 0."
            : "Weight must be a finite number >= 0.",
      });
      return;
    }

    if (criterionDialog.mode === "add") {
      const parsedAltValues: Record<string, number> = {};
      for (const alt of model.alternatives) {
        const raw = (criterionDialog.altValues[alt.id] ?? "").trim();
        const num = Number(raw);
        if (raw === "" || !Number.isFinite(num)) {
          setCriterionDialog({
            ...criterionDialog,
            formError:
              lang === "id"
                ? `Nilai awal untuk alternatif ${alt.id} wajib diisi dengan angka valid.`
                : `Initial value for alternative ${alt.id} must be a valid number.`,
          });
          return;
        }
        if (criterionDialog.type === "cost" && num <= 0) {
          setCriterionDialog({
            ...criterionDialog,
            formError:
              lang === "id"
                ? `Kriteria Cost membutuhkan nilai > 0 untuk alternatif ${alt.id}.`
                : `Cost criteria require values > 0 for alternative ${alt.id}.`,
          });
          return;
        }
        parsedAltValues[alt.id] = num;
      }

      const newId = nextUniqueId(
        "C",
        model.criteria.map((c) => c.id),
      );
      const newCriterion: Criterion = {
        id: newId,
        nameId,
        nameEn,
        weight,
        type: criterionDialog.type,
        descriptionId: criterionDialog.descriptionId.trim() || undefined,
        descriptionEn: criterionDialog.descriptionEn.trim() || undefined,
      };
      onUpdateModel((prev) => ({
        ...prev,
        criteria: [...prev.criteria, newCriterion],
        alternatives: prev.alternatives.map((alt) => ({
          ...alt,
          values: {
            ...alt.values,
            [newId]: parsedAltValues[alt.id],
          },
        })),
      }));
    } else if (criterionDialog.criterionId) {
      const targetId = criterionDialog.criterionId;
      onUpdateModel((prev) => ({
        ...prev,
        criteria: prev.criteria.map((c) =>
          c.id === targetId
            ? {
                ...c,
                nameId,
                nameEn,
                weight,
                type: criterionDialog.type,
                descriptionId: criterionDialog.descriptionId.trim() || undefined,
                descriptionEn: criterionDialog.descriptionEn.trim() || undefined,
              }
            : c,
        ),
      }));
      setWeightDrafts((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }

    setCriterionDialog(null);
  };

  const openAddAlternative = () => {
    const critValues: Record<string, string> = {};
    model.criteria.forEach((c) => {
      critValues[c.id] = "";
    });
    setAlternativeDialog({
      mode: "add",
      nameId: "",
      nameEn: "",
      critValues,
      formError: null,
    });
  };

  const openEditAlternative = (alt: Alternative) => {
    const critValues: Record<string, string> = {};
    model.criteria.forEach((c) => {
      critValues[c.id] = String(alt.values[c.id] ?? "");
    });
    setAlternativeDialog({
      mode: "edit",
      alternativeId: alt.id,
      nameId: alt.nameId,
      nameEn: alt.nameEn,
      critValues,
      formError: null,
    });
  };

  const submitAlternativeDialog = () => {
    if (!alternativeDialog) return;
    const nameId = alternativeDialog.nameId.trim();
    const nameEn = alternativeDialog.nameEn.trim();
    if (!nameId || !nameEn) {
      setAlternativeDialog({
        ...alternativeDialog,
        formError:
          lang === "id"
            ? "Nama alternatif Bahasa Indonesia dan English wajib diisi."
            : "Both Indonesian and English alternative names are required.",
      });
      return;
    }

    const parsedValues: Record<string, number> = {};
    for (const c of model.criteria) {
      const raw = (alternativeDialog.critValues[c.id] ?? "").trim();
      const num = Number(raw);
      if (raw === "" || !Number.isFinite(num)) {
        setAlternativeDialog({
          ...alternativeDialog,
          formError:
            lang === "id"
              ? `Nilai untuk kriteria ${c.id} wajib berupa angka valid.`
              : `Value for criterion ${c.id} must be a valid number.`,
        });
        return;
      }
      if (c.type === "cost" && num <= 0) {
        setAlternativeDialog({
          ...alternativeDialog,
          formError:
            lang === "id"
              ? `Kriteria Cost ${c.id} membutuhkan nilai > 0.`
              : `Cost criterion ${c.id} requires a value > 0.`,
        });
        return;
      }
      parsedValues[c.id] = num;
    }

    if (alternativeDialog.mode === "add") {
      const newId = nextUniqueId(
        "S",
        model.alternatives.map((a) => a.id),
      );
      onUpdateModel((prev) => ({
        ...prev,
        alternatives: [
          ...prev.alternatives,
          {
            id: newId,
            nameId,
            nameEn,
            values: parsedValues,
          },
        ],
      }));
    } else if (alternativeDialog.alternativeId) {
      const targetId = alternativeDialog.alternativeId;
      onUpdateModel((prev) => ({
        ...prev,
        alternatives: prev.alternatives.map((a) =>
          a.id === targetId
            ? {
                ...a,
                nameId,
                nameEn,
                values: parsedValues,
              }
            : a,
        ),
      }));
    }

    setAlternativeDialog(null);
  };

  const getCellError = (altId: string, critId: string) =>
    validation.errors.find(
      (e) => e.alternativeId === altId && e.criterionId === critId,
    );

  const getCriterionErrors = (critId: string) =>
    validation.errors.filter((e) => e.criterionId === critId && !e.alternativeId);

  const getAlternativeErrors = (altId: string) =>
    validation.errors.filter((e) => e.alternativeId === altId && !e.criterionId);

  return (
    <div className="space-y-6">
      {/* Header & Global Parameters */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {t.builder.heading}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t.builder.subheading}</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            disabled={isPreset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{t.common.resetPreset}</span>
          </button>
        </div>

        {/* Tau & Total Weight Controls */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <label
              htmlFor="tau-input"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-700"
            >
              {t.common.tau}
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="tau-input"
                type="number"
                step="0.01"
                min="0"
                value={tauDraft !== null ? tauDraft : String(model.tau)}
                onChange={(e) => {
                  const raw = e.target.value;
                  setTauDraft(raw);
                  const num = raw.trim() === "" ? NaN : Number(raw);
                  onUpdateModel((prev) => ({ ...prev, tau: num }));
                }}
                onBlur={() => setTauDraft(null)}
                className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
              <span className="text-xs text-slate-600">
                {t.builder.tauRecommendedRange}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{t.builder.tauHelp}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                {t.common.totalWeight}
              </span>
              <span
                className={`font-mono text-sm font-bold tabular-nums ${
                  weightIsExact ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatNum(totalWeight, 4)} / 1.0000
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p
                className={`text-xs ${
                  weightIsExact ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {weightIsExact
                  ? t.builder.weightExactHint
                  : t.builder.weightMismatchHint}
              </p>
              {!weightIsExact && model.criteria.length > 0 && (
                <button
                  type="button"
                  onClick={handleNormalizeWeights}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                >
                  <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.common.normalizeWeights}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Validation Panel */}
        <div
          className={`mt-4 rounded-lg border p-4 ${
            validation.valid
              ? validation.warnings.length > 0
                ? "border-amber-200 bg-amber-50/70"
                : "border-emerald-200 bg-emerald-50/60"
              : "border-rose-200 bg-rose-50/70"
          }`}
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-800">
            {validation.valid ? (
              <CheckCircle2
                className="h-4 w-4 text-emerald-700"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="h-4 w-4 text-rose-700"
                aria-hidden="true"
              />
            )}
            <span>{t.builder.validationPanelTitle}</span>
          </div>
          {validation.errors.length === 0 && validation.warnings.length === 0 ? (
            <p className="mt-1.5 text-xs text-emerald-800">
              {t.builder.allValidMessage}
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs">
              {validation.errors.map((err, idx) => (
                <li
                  key={`${err.code}-${idx}`}
                  className="flex items-start gap-1.5 text-rose-800"
                >
                  <AlertCircle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{lang === "id" ? err.messageId : err.messageEn}</span>
                </li>
              ))}
              {validation.warnings.map((warn, idx) => (
                <li
                  key={`${warn.code}-${idx}`}
                  className="flex items-start gap-1.5 text-amber-800"
                >
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{lang === "id" ? warn.messageId : warn.messageEn}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Sub-navigation Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div
          className="flex flex-wrap border-b border-slate-200 px-4 pt-3"
          role="tablist"
          aria-label={t.builder.heading}
        >
          {(
            [
              ["criteria", t.builder.tabs.criteria],
              ["alternatives", t.builder.tabs.alternatives],
              ["matrix", t.builder.tabs.matrix],
            ] as const
          ).map(([tabKey, label]) => {
            const selected = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tabKey)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 ${
                  selected
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* CRITERIA TAB */}
          {activeTab === "criteria" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {t.builder.directionLegend}
                  </span>{" "}
                  {t.builder.benefitHint} {t.builder.costHint}
                </div>
                <button
                  type="button"
                  onClick={openAddCriterion}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t.builder.addCriterion}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    {t.builder.tabs.criteria}
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-2.5">{t.common.id}</th>
                      <th className="px-3 py-2.5">{t.common.nameId}</th>
                      <th className="px-3 py-2.5">{t.common.nameEn}</th>
                      <th className="px-3 py-2.5">{t.common.type}</th>
                      <th className="px-3 py-2.5">{t.common.weight}</th>
                      <th className="px-3 py-2.5 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {model.criteria.map((c, idx) => {
                      const rowErrors = getCriterionErrors(c.id);
                      const weightVal =
                        weightDrafts[c.id] !== undefined
                          ? weightDrafts[c.id]
                          : String(c.weight);
                      return (
                        <tr
                          key={c.id}
                          className={
                            rowErrors.length > 0
                              ? "bg-rose-50/50"
                              : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-700">
                            {c.id}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-900">
                              {c.nameId}
                            </div>
                            {rowErrors.map((err, i) => (
                              <div
                                key={i}
                                className="mt-1 text-xs text-rose-700"
                              >
                                {lang === "id" ? err.messageId : err.messageEn}
                              </div>
                            ))}
                          </td>
                          <td className="px-3 py-3 text-slate-700">{c.nameEn}</td>
                          <td className="px-3 py-3">
                            <select
                              aria-label={`${t.common.type} ${c.id}`}
                              value={c.type}
                              onChange={(e) => {
                                const nextType = e.target.value as CriterionType;
                                onUpdateModel((prev) => ({
                                  ...prev,
                                  criteria: prev.criteria.map((item) =>
                                    item.id === c.id
                                      ? { ...item, type: nextType }
                                      : item,
                                  ),
                                }));
                              }}
                              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                            >
                              <option value="benefit">{t.common.benefit}</option>
                              <option value="cost">{t.common.cost}</option>
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              aria-label={`${t.common.weight} ${c.id}`}
                              value={weightVal}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setWeightDrafts((prev) => ({
                                  ...prev,
                                  [c.id]: raw,
                                }));
                                const num = raw.trim() === "" ? NaN : Number(raw);
                                onUpdateModel((prev) => ({
                                  ...prev,
                                  criteria: prev.criteria.map((item) =>
                                    item.id === c.id
                                      ? { ...item, weight: num }
                                      : item,
                                  ),
                                }));
                              }}
                              onBlur={() =>
                                setWeightDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                })
                              }
                              className="w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCriterion(idx, -1)}
                                disabled={idx === 0}
                                aria-label={`${t.common.moveUp} ${c.id}`}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCriterion(idx, 1)}
                                disabled={idx === model.criteria.length - 1}
                                aria-label={`${t.common.moveDown} ${c.id}`}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditCriterion(c)}
                                aria-label={`${t.common.edit} ${c.id}`}
                                className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteCriterionTarget(c)}
                                aria-label={`${t.common.delete} ${c.id}`}
                                className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALTERNATIVES TAB */}
          {activeTab === "alternatives" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openAddAlternative}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t.builder.addAlternative}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    {t.builder.tabs.alternatives}
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-3 py-2.5">{t.common.id}</th>
                      <th className="px-3 py-2.5">{t.common.nameId}</th>
                      <th className="px-3 py-2.5">{t.common.nameEn}</th>
                      <th className="px-3 py-2.5 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {model.alternatives.map((alt, idx) => {
                      const altErrors = getAlternativeErrors(alt.id);
                      return (
                        <tr
                          key={alt.id}
                          className={
                            altErrors.length > 0
                              ? "bg-rose-50/50"
                              : "hover:bg-slate-50/70"
                          }
                        >
                          <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-700">
                            {alt.id}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-900">
                              {alt.nameId}
                            </div>
                            {altErrors.map((err, i) => (
                              <div
                                key={i}
                                className="mt-1 text-xs text-rose-700"
                              >
                                {lang === "id" ? err.messageId : err.messageEn}
                              </div>
                            ))}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {alt.nameEn}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveAlternative(idx, -1)}
                                disabled={idx === 0}
                                aria-label={`${t.common.moveUp} ${alt.id}`}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveAlternative(idx, 1)}
                                disabled={idx === model.alternatives.length - 1}
                                aria-label={`${t.common.moveDown} ${alt.id}`}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditAlternative(alt)}
                                aria-label={`${t.common.edit} ${alt.id}`}
                                className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAlternativeTarget(alt)}
                                aria-label={`${t.common.delete} ${alt.id}`}
                                className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DECISION MATRIX TAB */}
          {activeTab === "matrix" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">{t.builder.matrixHint}</p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    {t.builder.tabs.matrix}
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      <th className="px-3 py-3">{t.common.alternative}</th>
                      {model.criteria.map((c) => (
                        <th key={c.id} className="min-w-[140px] px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {c.id}: {lang === "id" ? c.nameId : c.nameEn}
                            </span>
                            <div className="flex items-center gap-2">
                              <CriterionBadge type={c.type} lang={lang} compact />
                              <span className="font-mono text-[11px] font-normal text-slate-500">
                                w={formatNum(c.weight, 2)}
                              </span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {model.alternatives.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          <span className="font-mono text-xs text-slate-500">
                            {alt.id}
                          </span>{" "}
                          {lang === "id" ? alt.nameId : alt.nameEn}
                        </td>
                        {model.criteria.map((c) => {
                          const key = `${alt.id}::${c.id}`;
                          const cellErr = getCellError(alt.id, c.id);
                          const displayVal =
                            cellDrafts[key] !== undefined
                              ? cellDrafts[key]
                              : alt.values[c.id] !== undefined &&
                                  Number.isFinite(alt.values[c.id])
                                ? String(alt.values[c.id])
                                : "";
                          return (
                            <td key={c.id} className="px-3 py-2.5 align-top">
                              <input
                                type="number"
                                step="any"
                                aria-label={`${alt.id} ${c.id}`}
                                value={displayVal}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setCellDrafts((prev) => ({
                                    ...prev,
                                    [key]: raw,
                                  }));
                                  const num = raw.trim() === "" ? NaN : Number(raw);
                                  onUpdateModel((prev) => ({
                                    ...prev,
                                    alternatives: prev.alternatives.map((item) =>
                                      item.id === alt.id
                                        ? {
                                            ...item,
                                            values: {
                                              ...item.values,
                                              [c.id]: num,
                                            },
                                          }
                                        : item,
                                    ),
                                  }));
                                }}
                                onBlur={() =>
                                  setCellDrafts((prev) => {
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  })
                                }
                                className={`w-28 rounded-md border px-2.5 py-1.5 font-mono text-xs tabular-nums focus:outline-none focus:ring-2 ${
                                  cellErr
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500/30"
                                    : "border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-slate-900/20"
                                }`}
                              />
                              {cellErr && (
                                <p className="mt-1 text-[11px] leading-tight text-rose-700">
                                  {lang === "id"
                                    ? cellErr.messageId
                                    : cellErr.messageEn}
                                </p>
                              )}
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
        </div>
      </div>

      {/* Add/Edit Criterion Modal */}
      {criterionDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crit-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3
                id="crit-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                {criterionDialog.mode === "add"
                  ? t.builder.newCriterionTitle
                  : t.builder.editCriterionTitle}
              </h3>
              <button
                type="button"
                onClick={() => setCriterionDialog(null)}
                aria-label={t.common.close}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.nameId}
                </label>
                <input
                  type="text"
                  value={criterionDialog.nameId}
                  onChange={(e) =>
                    setCriterionDialog({
                      ...criterionDialog,
                      nameId: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.nameEn}
                </label>
                <input
                  type="text"
                  value={criterionDialog.nameEn}
                  onChange={(e) =>
                    setCriterionDialog({
                      ...criterionDialog,
                      nameEn: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t.common.type}
                  </label>
                  <select
                    value={criterionDialog.type}
                    onChange={(e) =>
                      setCriterionDialog({
                        ...criterionDialog,
                        type: e.target.value as CriterionType,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  >
                    <option value="benefit">{t.common.benefit}</option>
                    <option value="cost">{t.common.cost}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t.common.weight}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={criterionDialog.weightStr}
                    onChange={(e) =>
                      setCriterionDialog({
                        ...criterionDialog,
                        weightStr: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.descriptionId} ({t.common.optional})
                </label>
                <input
                  type="text"
                  value={criterionDialog.descriptionId}
                  onChange={(e) =>
                    setCriterionDialog({
                      ...criterionDialog,
                      descriptionId: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.descriptionEn} ({t.common.optional})
                </label>
                <input
                  type="text"
                  value={criterionDialog.descriptionEn}
                  onChange={(e) =>
                    setCriterionDialog({
                      ...criterionDialog,
                      descriptionEn: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              {criterionDialog.mode === "add" &&
                model.alternatives.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-700">
                      {t.builder.initialValuesHint}
                    </div>
                    <div className="mt-2 space-y-2">
                      {model.alternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <label className="text-xs text-slate-700">
                            {alt.id}: {lang === "id" ? alt.nameId : alt.nameEn}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={criterionDialog.altValues[alt.id] ?? ""}
                            onChange={(e) =>
                              setCriterionDialog({
                                ...criterionDialog,
                                altValues: {
                                  ...criterionDialog.altValues,
                                  [alt.id]: e.target.value,
                                },
                              })
                            }
                            className="w-28 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {criterionDialog.formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {criterionDialog.formError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCriterionDialog(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={submitCriterionDialog}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Alternative Modal */}
      {alternativeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alt-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3
                id="alt-dialog-title"
                className="text-base font-semibold text-slate-900"
              >
                {alternativeDialog.mode === "add"
                  ? t.builder.newAlternativeTitle
                  : t.builder.editAlternativeTitle}
              </h3>
              <button
                type="button"
                onClick={() => setAlternativeDialog(null)}
                aria-label={t.common.close}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.nameId}
                </label>
                <input
                  type="text"
                  value={alternativeDialog.nameId}
                  onChange={(e) =>
                    setAlternativeDialog({
                      ...alternativeDialog,
                      nameId: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {t.common.nameEn}
                </label>
                <input
                  type="text"
                  value={alternativeDialog.nameEn}
                  onChange={(e) =>
                    setAlternativeDialog({
                      ...alternativeDialog,
                      nameEn: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
              </div>

              {model.criteria.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">
                    {t.builder.initialValuesHint}
                  </div>
                  <div className="mt-2 space-y-2">
                    {model.criteria.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <label className="text-xs text-slate-700">
                          {c.id}: {lang === "id" ? c.nameId : c.nameEn} (
                          {c.type === "benefit"
                            ? t.common.benefit
                            : t.common.cost}
                          )
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={alternativeDialog.critValues[c.id] ?? ""}
                          onChange={(e) =>
                            setAlternativeDialog({
                              ...alternativeDialog,
                              critValues: {
                                ...alternativeDialog.critValues,
                                [c.id]: e.target.value,
                              },
                            })
                          }
                          className="w-28 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alternativeDialog.formError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {alternativeDialog.formError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAlternativeDialog(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={submitAlternativeDialog}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmResetOpen}
        title={t.builder.resetConfirmTitle}
        body={t.builder.resetConfirmBody}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        onConfirm={() => {
          onResetPreset();
          setWeightDrafts({});
          setCellDrafts({});
          setTauDraft(null);
          setConfirmResetOpen(false);
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />

      <ConfirmDialog
        open={deleteCriterionTarget !== null}
        title={t.builder.deleteCriterionTitle}
        body={t.builder.deleteCriterionBody}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={() => {
          if (!deleteCriterionTarget) return;
          const targetId = deleteCriterionTarget.id;
          onUpdateModel((prev) => ({
            ...prev,
            criteria: prev.criteria.filter((c) => c.id !== targetId),
            alternatives: prev.alternatives.map((alt) => {
              const nextValues = { ...alt.values };
              delete nextValues[targetId];
              return { ...alt, values: nextValues };
            }),
          }));
          setDeleteCriterionTarget(null);
        }}
        onCancel={() => setDeleteCriterionTarget(null)}
      />

      <ConfirmDialog
        open={deleteAlternativeTarget !== null}
        title={t.builder.deleteAlternativeTitle}
        body={t.builder.deleteAlternativeBody}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={() => {
          if (!deleteAlternativeTarget) return;
          const targetId = deleteAlternativeTarget.id;
          onUpdateModel((prev) => ({
            ...prev,
            alternatives: prev.alternatives.filter((a) => a.id !== targetId),
          }));
          setDeleteAlternativeTarget(null);
        }}
        onCancel={() => setDeleteAlternativeTarget(null)}
      />
    </div>
  );
}


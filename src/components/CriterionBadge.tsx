import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { CriterionType, Language } from "../domain/codas/types";
import { TRANSLATIONS } from "../i18n/translations";

interface CriterionBadgeProps {
  type: CriterionType;
  lang: Language;
  compact?: boolean;
}

export function CriterionBadge({
  type,
  lang,
  compact = false,
}: CriterionBadgeProps) {
  const t = TRANSLATIONS[lang];
  const isBenefit = type === "benefit";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        isBenefit
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {isBenefit ? (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isBenefit
          ? compact
            ? "Ben"
            : t.common.benefit
          : compact
            ? "Cost"
            : t.common.cost}
      </span>
    </span>
  );
}


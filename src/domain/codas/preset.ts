import type { CodasModel } from "./types";

export const JOURNAL_REFERENCE = {
  citationEn:
    "Badi, I., Ballem, M., & Shetwan, A. (2018). Site selection of desalination plant in Libya by using Combinative Distance-Based Assessment (CODAS) method. International Journal for Quality Research, 12(3), 609-624. https://doi.org/10.18421/IJQR12.03-04",
  citationId:
    "Badi, I., Ballem, M., & Shetwan, A. (2018). Site selection of desalination plant in Libya by using Combinative Distance-Based Assessment (CODAS) method. International Journal for Quality Research, 12(3), 609-624. https://doi.org/10.18421/IJQR12.03-04",
  doi: "https://doi.org/10.18421/IJQR12.03-04",
  methodOrigin: "Keshavarz Ghorabaee, M., Zavadskas, E. K., Turskis, Z., & Antucheviciene, J. (2016)",
};

export const DEFAULT_TAU = 0.02;
export const RECOMMENDED_TAU_MIN = 0.01;
export const RECOMMENDED_TAU_MAX = 0.05;
export const WEIGHT_SUM_TOLERANCE = 1e-6;
export const TIE_TOLERANCE = 1e-12;

export function createJournalPresetModel(): CodasModel {
  return {
    tau: DEFAULT_TAU,
    criteria: [
      {
        id: "C1",
        nameEn: "Raw Water Proximity",
        nameId: "Kedekatan dengan Air Baku",
        weight: 0.19,
        type: "cost",
        descriptionEn: "Distance and access cost relative to the raw seawater intake source (lower is better).",
        descriptionId: "Jarak dan biaya akses terhadap sumber air baku laut (lebih kecil lebih baik).",
      },
      {
        id: "C2",
        nameEn: "Raw Water Quality",
        nameId: "Kualitas Air Baku",
        weight: 0.26,
        type: "benefit",
        descriptionEn: "Intake water purity and suitability for desalination treatment (higher is better).",
        descriptionId: "Tingkat kebersihan dan kelayakan air baku untuk proses desalinasi (lebih besar lebih baik).",
      },
      {
        id: "C3",
        nameEn: "Product Water Distribution Network",
        nameId: "Jaringan Distribusi Air Produk",
        weight: 0.24,
        type: "benefit",
        descriptionEn: "Availability and readiness of pipelines to distribute desalinated water (higher is better).",
        descriptionId: "Ketersediaan dan kesiapan jaringan distribusi air hasil desalinasi (lebih besar lebih baik).",
      },
      {
        id: "C4",
        nameEn: "Vicinity Power Plants / Electrical Network",
        nameId: "Kedekatan dengan Pembangkit / Jaringan Listrik",
        weight: 0.17,
        type: "benefit",
        descriptionEn: "Proximity and reliability of electrical power supply for plant operation (higher is better).",
        descriptionId: "Kedekatan dan keandalan pasokan listrik untuk operasional instalasi (lebih besar lebih baik).",
      },
      {
        id: "C5",
        nameEn: "Cost",
        nameId: "Biaya",
        weight: 0.14,
        type: "cost",
        descriptionEn: "Overall investment and operational cost indicator (lower is better).",
        descriptionId: "Indikator biaya investasi dan operasional keseluruhan (lebih kecil lebih baik).",
      },
    ],
    alternatives: [
      {
        id: "S1",
        nameEn: "Tripoli",
        nameId: "Tripoli",
        values: { C1: 8, C2: 8, C3: 10, C4: 9, C5: 5 },
      },
      {
        id: "S2",
        nameEn: "Zawia",
        nameId: "Zawia",
        values: { C1: 8, C2: 9, C3: 9, C4: 9, C5: 8 },
      },
      {
        id: "S3",
        nameEn: "Qarabouli",
        nameId: "Qarabouli",
        values: { C1: 9, C2: 9, C3: 7, C4: 8, C5: 6 },
      },
      {
        id: "S4",
        nameEn: "Surman",
        nameId: "Surman",
        values: { C1: 8, C2: 8, C3: 7, C4: 8, C5: 9 },
      },
      {
        id: "S5",
        nameEn: "Suggested Location",
        nameId: "Lokasi Usulan",
        values: { C1: 9, C2: 8, C3: 7, C4: 7, C5: 4 },
      },
    ],
  };
}


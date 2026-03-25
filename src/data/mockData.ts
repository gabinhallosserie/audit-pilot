export interface Audit {
  id: string;
  title: string;
  referentiel: string;
  status: "planifié" | "en_cours" | "terminé" | "clôturé";
  date: string;
  auditeur: string;
  audite: string;
  company: string;
  perimetre: string;
}

export interface Mission {
  id: string;
  auditId: string;
  title: string;
  referentiel: string;
  status: "préparation" | "en_cours" | "clôture";
  date: string;
  company: string;
  contact: string;
}

export interface ChecklistItem {
  id: string;
  clause: string;
  description: string;
  checked: boolean;
}

export const MOCK_AUDITS: Audit[] = [
  {
    id: "AUD-2026-001",
    title: "Audit ISO 14001 — Site de Lyon",
    referentiel: "ISO 14001:2015",
    status: "en_cours",
    date: "2026-03-28",
    auditeur: "Jean Martin",
    audite: "Marie Dupont",
    company: "Écovert Industries",
    perimetre: "Système de management environnemental — Site de production Lyon",
  },
  {
    id: "AUD-2026-002",
    title: "Audit ISO 9001 — Siège social",
    referentiel: "ISO 9001:2015",
    status: "planifié",
    date: "2026-04-15",
    auditeur: "Jean Martin",
    audite: "Marie Dupont",
    company: "Écovert Industries",
    perimetre: "Processus qualité — Direction et support",
  },
  {
    id: "AUD-2025-018",
    title: "Audit CSRD — Reporting ESG",
    referentiel: "CSRD / ESRS",
    status: "terminé",
    date: "2025-11-20",
    auditeur: "Jean Martin",
    audite: "Marie Dupont",
    company: "Écovert Industries",
    perimetre: "Reporting extra-financier",
  },
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: "MIS-001",
    auditId: "AUD-2026-001",
    title: "Mission ISO 14001 — Écovert Lyon",
    referentiel: "ISO 14001:2015",
    status: "en_cours",
    date: "2026-03-28",
    company: "Écovert Industries",
    contact: "Marie Dupont",
  },
  {
    id: "MIS-002",
    auditId: "AUD-2026-002",
    title: "Mission ISO 9001 — Écovert Siège",
    referentiel: "ISO 9001:2015",
    status: "préparation",
    date: "2026-04-15",
    company: "Écovert Industries",
    contact: "Marie Dupont",
  },
];

export const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: "CL-01", clause: "4.1", description: "Compréhension de l'organisme et de son contexte", checked: false },
  { id: "CL-02", clause: "4.2", description: "Compréhension des besoins et attentes des parties intéressées", checked: false },
  { id: "CL-03", clause: "4.3", description: "Détermination du domaine d'application du SME", checked: true },
  { id: "CL-04", clause: "5.1", description: "Leadership et engagement", checked: true },
  { id: "CL-05", clause: "5.2", description: "Politique environnementale", checked: false },
  { id: "CL-06", clause: "6.1", description: "Actions face aux risques et opportunités", checked: false },
  { id: "CL-07", clause: "6.2", description: "Objectifs environnementaux et planification", checked: false },
  { id: "CL-08", clause: "7.1", description: "Ressources", checked: true },
  { id: "CL-09", clause: "7.2", description: "Compétences", checked: false },
  { id: "CL-10", clause: "8.1", description: "Planification et maîtrise opérationnelles", checked: false },
  { id: "CL-11", clause: "9.1", description: "Surveillance, mesure, analyse et évaluation", checked: false },
  { id: "CL-12", clause: "10.1", description: "Généralités — Amélioration", checked: false },
];

export type FindingType = "conformite" | "ecart_mineur" | "ecart_majeur" | "point_fort";

export interface Finding {
  id: string;
  missionId: string;
  type: FindingType;
  clause: string;
  description: string;
  evidence: string;
  createdAt: string;
}

export const FINDING_LABELS: Record<FindingType, string> = {
  conformite: "Conformité",
  ecart_mineur: "Écart mineur",
  ecart_majeur: "Écart majeur",
  point_fort: "Point fort",
};

export const FINDING_COLORS: Record<FindingType, string> = {
  conformite: "bg-success text-success-foreground",
  ecart_mineur: "bg-warning text-warning-foreground",
  ecart_majeur: "bg-destructive text-destructive-foreground",
  point_fort: "bg-secondary text-secondary-foreground",
};

export const FINDING_HEX: Record<FindingType, string> = {
  conformite: "#22c55e",
  ecart_mineur: "#f59e0b",
  ecart_majeur: "#ef4444",
  point_fort: "#00B4A6",
};

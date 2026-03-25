import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Mission, type Finding, FINDING_LABELS, FINDING_HEX } from "@/data/mockData";

export function generateReport(mission: Mission, findings: Finding[]) {
  const doc = new jsPDF();
  const navy = "#1B2A4A";
  const teal = "#00B4A6";
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header ───
  doc.setFillColor(navy);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AUDIT.IO", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Rapport d'audit", 14, 26);

  doc.setFontSize(9);
  doc.text(mission.title, 14, 34);
  doc.text(`Ref: ${mission.id}`, pageWidth - 14, 18, { align: "right" });
  doc.text(new Date(mission.date).toLocaleDateString("fr-FR"), pageWidth - 14, 26, { align: "right" });

  // Teal accent line
  doc.setFillColor(teal);
  doc.rect(0, 42, pageWidth, 2, "F");

  // ─── Mission info ───
  let y = 54;
  doc.setTextColor(navy);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informations de la mission", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#333333");
  const info = [
    ["Référentiel", mission.referentiel],
    ["Organisme audité", mission.company],
    ["Contact", mission.contact],
    ["Date", new Date(mission.date).toLocaleDateString("fr-FR")],
    ["Statut", mission.status],
  ];
  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 6;
  });

  // ─── Summary ───
  y += 6;
  doc.setTextColor(navy);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Synthèse des constats", 14, y);
  y += 4;

  const summary = [
    { type: "conformite" as const, count: findings.filter((f) => f.type === "conformite").length },
    { type: "ecart_mineur" as const, count: findings.filter((f) => f.type === "ecart_mineur").length },
    { type: "ecart_majeur" as const, count: findings.filter((f) => f.type === "ecart_majeur").length },
    { type: "point_fort" as const, count: findings.filter((f) => f.type === "point_fort").length },
  ];

  autoTable(doc, {
    startY: y,
    head: [["Type de constat", "Nombre"]],
    body: summary.map((s) => [FINDING_LABELS[s.type], String(s.count)]),
    headStyles: { fillColor: navy, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: "center" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const type = summary[data.row.index]?.type;
        if (type) {
          data.cell.styles.textColor = FINDING_HEX[type];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ─── Detail table ───
  y = (doc as any).lastAutoTable.finalY + 10;
  doc.setTextColor(navy);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Détail des constats", 14, y);
  y += 4;

  if (findings.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Type", "Clause", "Description", "Preuves"]],
      body: findings.map((f) => [FINDING_LABELS[f.type], f.clause || "—", f.description, f.evidence || "—"]),
      headStyles: { fillColor: navy, textColor: "#FFFFFF", fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 80 },
        3: { cellWidth: 50 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const finding = findings[data.row.index];
          if (finding) {
            data.cell.styles.textColor = FINDING_HEX[finding.type];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor("#888888");
    doc.text("Aucun constat enregistré pour cette mission.", 14, y);
    y += 14;
  }

  // ─── Signatures ───
  // Check if we need a new page
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setTextColor(navy);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Signatures", 14, y);
  y += 10;

  doc.setDrawColor(navy);
  doc.setLineWidth(0.3);

  // Auditeur signature
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#333333");
  doc.text("L'auditeur", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text("Nom : Jean Martin", 14, y + 6);
  doc.text("Date :", 14, y + 12);
  doc.text("Signature :", 14, y + 18);
  doc.rect(14, y + 20, 70, 25);

  // Audité signature
  doc.setFont("helvetica", "bold");
  doc.text("L'audité", pageWidth / 2 + 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${mission.contact}`, pageWidth / 2 + 10, y + 6);
  doc.text("Date :", pageWidth / 2 + 10, y + 12);
  doc.text("Signature :", pageWidth / 2 + 10, y + 18);
  doc.rect(pageWidth / 2 + 10, y + 20, 70, 25);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor("#999999");
    doc.text(
      `AUDIT.IO — Rapport généré le ${new Date().toLocaleDateString("fr-FR")} — Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`Rapport_${mission.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ComplianceReport, PolicyViolation } from "@/types";
import { format } from "date-fns";

export const downloadCompliancePDF = (
  report: ComplianceReport,
  violations: PolicyViolation[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  doc.setFillColor(34, 197, 94); // Green-600
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("GreenPass Compliance Report", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Period: ${report.reportPeriod} (${report.reportType.toUpperCase()})`, 15, 30);
  doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 15, 35);

  // --- Summary Section ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 15, 55);

  autoTable(doc, {
    startY: 60,
    head: [["Metric", "Value", "Status", "Comparison"]],
    body: [
      [
        "Compliance Score",
        `${report.complianceScore.toFixed(1)}%`,
        report.complianceScore >= 80 ? "PASS" : "ACTION REQUIRED",
        report.previousPeriodScore !== undefined && report.previousPeriodScore !== null
          ? `${(report.complianceScore - report.previousPeriodScore).toFixed(1)}% vs prev`
          : "N/A",
      ],
      ["Total Tourists", report.totalTourists.toLocaleString(), "", ""],
      ["Sustainable Capacity", report.sustainableCapacity.toLocaleString(), "", ""],
      [
        "Capacity Utilization",
        report.sustainableCapacity > 0
          ? `${((report.totalTourists / report.sustainableCapacity) * 100).toFixed(1)}%`
          : "N/A",
        report.totalTourists <= report.sustainableCapacity ? "OPTIMAL" : "OVER CAPACITY",
        "",
      ],
      ["Status", report.status.toUpperCase(), report.status === "approved" ? "OFFICIAL" : "PENDING REVIEW", ""],
    ],
    theme: "striped",
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
  });

  // --- Environmental Metrics Section ---
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Environmental & Sustainability Metrics", 15, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [["Category", "Metric", "Current Value", "Target/Limit"]],
    body: [
      ["Waste Management", "Total Waste Generated", `${report.wasteMetrics.totalWaste.toLocaleString()} kg`, "-"],
      [
        "Waste Management",
        "Recycled Waste",
        `${report.wasteMetrics.recycledWaste.toLocaleString()} kg`,
        report.wasteMetrics.totalWaste > 0
          ? `${((report.wasteMetrics.recycledWaste / report.wasteMetrics.totalWaste) * 100).toFixed(1)}% rate`
          : "0.0% rate",
      ],
      ["Waste Management", "Reduction Target", "-", `${report.wasteMetrics.wasteReductionTarget.toLocaleString()} kg`],
      ["Carbon Footprint", "Total CO2 Emissions", `${report.carbonFootprint.toLocaleString()} kg`, "N/A"],
      ["Ecological Impact", "Impact Index (0-10)", report.ecologicalImpactIndex.toFixed(2), "< 2.0 (Low Impact)"],
    ],
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
  });

  // --- Ecological Damage Indicators ---
  if (report.ecologicalDamageIndicators) {
    const finalYDamage = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Ecological Damage Indicators", 15, finalYDamage);

    autoTable(doc, {
      startY: finalYDamage + 5,
      head: [["Indicator", "Value", "Risk Level"]],
      body: [
        ["Soil Compaction", report.ecologicalDamageIndicators.soilCompaction.toFixed(2), report.ecologicalDamageIndicators.soilCompaction > 0.7 ? "HIGH" : "NORMAL"],
        ["Vegetation Disturbance", report.ecologicalDamageIndicators.vegetationDisturbance.toFixed(2), report.ecologicalDamageIndicators.vegetationDisturbance > 5 ? "ACTION REQ" : "LOW"],
        ["Wildlife Disturbance", report.ecologicalDamageIndicators.wildlifeDisturbance.toFixed(2), report.ecologicalDamageIndicators.wildlifeDisturbance > 5 ? "ACTION REQ" : "LOW"],
        ["Water Source Impact", report.ecologicalDamageIndicators.waterSourceImpact.toFixed(2), report.ecologicalDamageIndicators.waterSourceImpact > 10 ? "MONITOR" : "LOW"],
      ],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    });
  }

  // --- Policy Enforcement Section ---
  const finalY2 = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Policy Enforcement & Violations", 15, finalY2);

  if (violations.length > 0) {
    autoTable(doc, {
      startY: finalY2 + 5,
      head: [["Date", "Destination", "Violation Type", "Severity", "Fine Amount"]],
      body: violations.map(v => [
        format(v.reportedAt, "yyyy-MM-dd"),
        v.destinationId, // In a real app, we'd join with destination name
        v.violationType,
        v.severity.toUpperCase(),
        `$${v.fineAmount.toLocaleString()}`
      ]),
      theme: "striped",
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("No policy violations recorded for this period.", 15, finalY2 + 10);
  }

  // --- Footer & Approval ---
  const finalY3 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : finalY2 + 40;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(15, finalY3, 80, finalY3);
  doc.line(pageWidth - 80, finalY3, pageWidth - 15, finalY3);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Admin Signature", 15, finalY3 + 5);
  doc.text("Government Liaison Signature", pageWidth - 80, finalY3 + 5);

  if (report.status === "approved" && report.approvedBy) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(34, 197, 94);
    doc.text(`Digitally Approved by: ${report.approvedBy}`, 15, finalY3 + 12);
    doc.text(`Date: ${report.approvedAt ? format(report.approvedAt, "PPP") : "N/A"}`, 15, finalY3 + 17);
  }

  // Save the PDF
  doc.save(`Compliance_Report_${report.reportPeriod}_${report.id.substring(0, 8)}.pdf`);
};

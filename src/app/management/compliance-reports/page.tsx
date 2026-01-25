"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useModalAccessibility } from "@/lib/accessibility";
import {
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Plus,
  History,
  TrendingUp,
  ShieldCheck,
  Scale,
  Filter,
  CheckSquare,
} from "lucide-react";
import { getDbService } from "@/lib/databaseService";
import { ComplianceReport, PolicyViolation } from "@/types";
import { format } from "date-fns";
import { downloadCompliancePDF } from "@/lib/reportGenerator";

export default function ComplianceReportsPage() {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportMonth, setReportMonth] = useState(format(new Date(), "MM"));
  const [reportQuarter, setReportQuarter] = useState("1");
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportType, setReportType] = useState<"monthly" | "quarterly">("monthly");
  const [filterType, setFilterType] = useState<string>("All Types");
  
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({
    modalRef,
    isOpen: showGenerateModal,
    onClose: () => setShowGenerateModal(false)
  });

  const dbService = getDbService();

  useEffect(() => {
    loadData();
    checkAndAutoGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndAutoGenerate = async () => {
    try {
      const currentPeriod = format(new Date(), "yyyy-MM");
      const existingReports = await dbService.getComplianceReports();
      const hasCurrentReport = existingReports.some(r => r.reportPeriod === currentPeriod && r.reportType === 'monthly');
      
      if (!hasCurrentReport) {
        console.log("Auto-generating monthly compliance report for current period...");
        const metrics = await dbService.getComplianceMetrics(currentPeriod, 'monthly');
        const newReport = await dbService.createComplianceReport({
          ...metrics,
          status: "pending",
        });
        if (newReport) {
          setReports(prev => [newReport, ...prev]);
        }
      }
    } catch (error) {
      console.error("Error in auto-generation:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, violationsData] = await Promise.all([
        dbService.getComplianceReports(),
        dbService.getPolicyViolations(),
      ]);
      setReports(reportsData);
      setViolations(violationsData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const period = reportType === 'monthly' ? `${reportYear}-${reportMonth}` : `${reportYear}-Q${reportQuarter}`;
      const metrics = await dbService.getComplianceMetrics(period, reportType);
      const newReport = await dbService.createComplianceReport({
        ...metrics,
        status: "pending",
      });

      if (newReport) {
        setReports([newReport, ...reports]);
        setShowGenerateModal(false);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const success = await dbService.updateComplianceReportStatus(
        reportId,
        "approved",
        "admin-user" // Mock admin ID
      );
      if (success) {
        setReports(
          reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: "approved",
                  approvedBy: "admin-user",
                  approvedAt: new Date(),
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Error approving report:", error);
    }
  };

  const handleExportPDF = (report: ComplianceReport) => {
    const reportViolations = violations.filter((v) => {
      // Check if quarterly: e.g., "2024-Q1"
      const quarterlyMatch = report.reportPeriod.match(/^(\d{4})-Q([1-4])$/);
      
      if (quarterlyMatch) {
        const year = parseInt(quarterlyMatch[1]);
        const quarter = parseInt(quarterlyMatch[2]);
        const vDate = new Date(v.reportedAt);
        const vYear = vDate.getFullYear();
        const vMonth = vDate.getMonth(); // 0-11
        
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        
        return vYear === year && vMonth >= startMonth && vMonth <= endMonth;
      }
      
      // Default to monthly: "YYYY-MM"
      const vPeriod = format(v.reportedAt, "yyyy-MM");
      return vPeriod === report.reportPeriod;
    });
    downloadCompliancePDF(report, reportViolations);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              Environmental Compliance Reports
            </h1>
            <p className="text-gray-500 mt-1">
              Generate and manage regulatory reports for government oversight.
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Generate New Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +4.2% YoY
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Avg. Compliance Score</p>
            <p className="text-2xl font-bold text-gray-900">88.7%</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports.filter((r) => r.status === "pending").length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Policy Violations (MoM)</p>
            <p className="text-2xl font-bold text-gray-900">{violations.length}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                <Scale className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Penalties</p>
            <p className="text-2xl font-bold text-gray-900">
              ${violations.reduce((sum, v) => sum + v.fineAmount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              Report History
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none shadow-sm cursor-pointer"
                >
                  <option value="All Types" className="text-gray-900 bg-white">All Types</option>
                  <option value="monthly" className="text-gray-900 bg-white">Monthly</option>
                  <option value="quarterly" className="text-gray-900 bg-white">Quarterly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop View Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Period</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Compliance Score</th>
                  <th className="px-6 py-4 font-semibold">Tourist Volume</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : reports.filter(report => filterType === "All Types" || report.reportType === filterType).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No reports found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  reports
                    .filter(report => filterType === "All Types" || report.reportType === filterType)
                    .map((report, index) => (
                    <tr key={`${report.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{report.reportPeriod}</div>
                        <div className="text-xs text-gray-500">
                          Generated {format(report.createdAt, "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-sm text-gray-600">{report.reportType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${getScoreColor(report.complianceScore)}`}>
                          {report.complianceScore.toFixed(1)}%
                        </div>
                        {report.previousPeriodScore && (
                          <div className={`text-xs flex items-center gap-1 ${
                            report.complianceScore >= report.previousPeriodScore ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <TrendingUp className={`h-3 w-3 ${report.complianceScore < report.previousPeriodScore ? 'rotate-180' : ''}`} />
                            {Math.abs(report.complianceScore - report.previousPeriodScore).toFixed(1)}% vs prev
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {report.totalTourists.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          / {report.sustainableCapacity.toLocaleString()} limit
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status === "approved" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {report.status === "pending" && (
                          <button
                            onClick={() => handleApproveReport(report.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Report"
                          >
                            <CheckSquare className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExportPDF(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Export PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No reports generated yet.</div>
            ) : reports.filter(report => filterType === "All Types" || report.reportType === filterType).length === 0 ? (
              <div className="p-8 text-center text-gray-500">No reports found for the selected filter.</div>
            ) : (
              reports
                .filter(report => filterType === "All Types" || report.reportType === filterType)
                .map((report, index) => (
                <div key={`${report.id}-${index}`} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-bold text-gray-900">{report.reportPeriod}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Generated {format(report.createdAt, "MMM dd, yyyy")}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === "approved"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}
                    >
                      {report.status === "approved" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {report.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Score</span>
                      <div className={`text-lg font-bold ${getScoreColor(report.complianceScore)}`}>
                        {report.complianceScore.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Volume</span>
                      <div className="text-lg font-bold text-gray-900">
                        {report.totalTourists.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {report.status === "pending" && (
                      <button
                        onClick={() => handleApproveReport(report.id)}
                        className="flex-1 flex items-center justify-center min-h-[44px] gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl border border-green-100 transition-colors"
                      >
                        <CheckSquare className="h-5 w-5" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleExportPDF(report)}
                      className="flex-1 flex items-center justify-center min-h-[44px] gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-100 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Export PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div 
              ref={modalRef}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 id="modal-title" className="text-lg font-bold text-gray-900">Generate Compliance Report</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg p-1"
                  aria-label="Close modal"
                >
                  <Plus className="h-6 w-6 rotate-45" aria-hidden="true" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="report-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    id="report-type-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as "monthly" | "quarterly")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                {reportType === "monthly" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="report-year-input" className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        id="report-year-input"
                        type="number"
                        value={reportYear}
                        onChange={(e) => setReportYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div>
                      <label htmlFor="report-month-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Month
                      </label>
                      <select
                        id="report-month-select"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                      >
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="report-year-input-q" className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        id="report-year-input-q"
                        type="number"
                        value={reportYear}
                        onChange={(e) => setReportYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div>
                      <label htmlFor="report-quarter-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Quarter
                      </label>
                      <select
                        id="report-quarter-select"
                        value={reportQuarter}
                        onChange={(e) => setReportQuarter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 bg-white"
                      >
                        <option value="1">Q1 (Jan - Mar)</option>
                        <option value="2">Q2 (Apr - Jun)</option>
                        <option value="3">Q3 (Jul - Sep)</option>
                        <option value="4">Q4 (Oct - Dec)</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Generating a report will compute sustainability metrics, waste management data,
                    and carbon footprints for the selected period based on tourist activities.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Computing...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

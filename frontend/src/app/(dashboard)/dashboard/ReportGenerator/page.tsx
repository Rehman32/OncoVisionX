"use client";

import React, { useState } from "react";
import { FileText, Printer, Search, Activity, Calendar, User, Microscope, ScanLine } from "lucide-react";

// 1. Define the shape of the Report object (This fixes the 'any' error)
interface Report {
  id: string;
  patient: string;
  age: number;
  date: string;
  diagnosis: string;
  stage: string;
  confidence: string;
  status: string;
}

export default function ReportsPage() {
  // 2. Use the Interface here instead of <any>
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reports: Report[] = [
    { 
      id: "RPT-2026-089", 
      patient: "Muhammad Usman", 
      age: 45,
      date: "Jan 03, 2026", 
      diagnosis: "Lung Adenocarcinoma", 
      stage: "Stage IIIA", 
      confidence: "96.4%",
      status: "Finalized"
    },
    { 
      id: "RPT-2026-088", 
      patient: "Sana Ahmed", 
      age: 32,
      date: "Jan 02, 2026", 
      diagnosis: "Invasive Ductal Carcinoma", 
      stage: "Stage IIB", 
      confidence: "98.1%",
      status: "Finalized"
    },
    { 
      id: "RPT-2026-087", 
      patient: "Bilal Khan", 
      age: 58,
      date: "Jan 01, 2026", 
      diagnosis: "Benign Nodule", 
      stage: "N/A", 
      confidence: "99.5%",
      status: "Finalized"
    },
  ];

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      
      {/* LEFT SIDE: Patient List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Reports</h1>
          <p className="text-slate-500">Select a case to view the AI analysis.</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ID or Name..." 
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className={`cursor-pointer p-4 hover:bg-slate-50 transition-colors ${selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-slate-900">{report.patient}</h4>
                  <span className="text-xs text-slate-400">{report.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">{report.diagnosis}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${report.diagnosis.includes("Benign") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {report.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: The Report Preview */}
      <div className="hidden lg:block w-2/3">
        {selectedReport ? (
          <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-6">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <span className="font-semibold text-slate-700">Print Preview</span>
              </div>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print Report
              </button>
            </div>

            {/* The A4 Paper Look */}
            <div className="flex-1 bg-white shadow-lg rounded-lg p-10 overflow-y-auto border border-slate-200">
              
              {/* Report Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OncoVisionX</h1>
                  <p className="text-sm text-slate-500">Multi-Modal AI Diagnostic Center</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">CONFIDENTIAL</p>
                  <p className="text-xs text-slate-500">Report ID: {selectedReport.id}</p>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8 grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <User className="h-3 w-3" /> <span className="text-xs uppercase font-bold">Patient Name</span>
                  </div>
                  <p className="font-medium text-slate-900">{selectedReport.patient}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="h-3 w-3" /> <span className="text-xs uppercase font-bold">Date of Report</span>
                  </div>
                  <p className="font-medium text-slate-900">{selectedReport.date}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Activity className="h-3 w-3" /> <span className="text-xs uppercase font-bold">Clinical Status</span>
                  </div>
                  <p className="font-medium text-slate-900">Symptomatic / Referred</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Activity className="h-3 w-3" /> <span className="text-xs uppercase font-bold">Patient Age</span>
                  </div>
                  <p className="font-medium text-slate-900">{selectedReport.age} Years</p>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-blue-600" />
                  AI Diagnostic Assessment
                </h3>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3">Modality</th>
                        <th className="p-3">Findings</th>
                        <th className="p-3 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-medium flex items-center gap-2"><Microscope className="h-3 w-3"/> Histopathology</td>
                        <td className="p-3 text-slate-600">High-grade dysplasia observed</td>
                        <td className="p-3 text-right font-bold text-slate-900">98.2%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium flex items-center gap-2"><ScanLine className="h-3 w-3"/> Radiology (CT)</td>
                        <td className="p-3 text-slate-600">Mass detected in upper lobe</td>
                        <td className="p-3 text-right font-bold text-slate-900">94.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Conclusion Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Final Integrated Prediction</p>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{selectedReport.diagnosis}</h2>
                    <p className="text-lg text-slate-600 font-medium">{selectedReport.stage}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{selectedReport.confidence}</div>
                    <p className="text-xs text-slate-500">Overall Probability</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  Generated by OncoVisionX System. This report is for investigational use only and requires clinical verification.
                </p>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <div className="text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-900 font-medium">No Report Selected</h3>
              <p className="text-slate-500 text-sm">Select a patient from the list to preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
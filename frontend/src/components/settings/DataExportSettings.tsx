"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Calendar, FileJson, FileSpreadsheet, FileCode, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataExportSettings() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json' | 'xml') => {
    setIsExporting(format);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Data Export & Privacy
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Export your research data in various formats. All exported data is de-identified and complies with HIPAA regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Export Your Data</CardTitle>
          <CardDescription>Download your research data in your preferred format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV Export */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">CSV Format</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Excel-compatible spreadsheet format
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting !== null}
              className="gap-2"
            >
              {isExporting === 'csv' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* JSON Export */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
                <FileJson className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">JSON Format</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Structured data format for analysis
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting !== null}
              className="gap-2"
            >
              {isExporting === 'json' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* XML Export */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
                <FileCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">XML Format</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enterprise-standard data format
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleExport('xml')}
              disabled={isExporting !== null}
              className="gap-2"
            >
              {isExporting === 'xml' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Export History</CardTitle>
          <CardDescription>Your recent data exports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  research_data_2025.csv
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jan 5, 2025 at 2:30 PM
                  </p>
                  <Badge variant="secondary" className="text-xs">5.2 MB</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  staging_results_2024.json
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dec 28, 2024 at 10:15 AM
                  </p>
                  <Badge variant="secondary" className="text-xs">3.8 MB</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        <CardHeader>
          <CardTitle className="text-base">Data Export Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>✓ All patient identifiable information (PII) removed</p>
          <p>✓ De-identified per HIPAA Safe Harbor method</p>
          <p>✓ Exports are encrypted and logged</p>
          <p>✓ 30-day retention policy for export history</p>
          <p>✓ You can request permanent deletion of exports</p>
        </CardContent>
      </Card>
    </div>
  );
}
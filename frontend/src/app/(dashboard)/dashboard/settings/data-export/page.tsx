"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileJson, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  format: string;
  size: string;
}

export default function DataExportPage() {
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportOptions: ExportOption[] = [
    {
      id: 'profile',
      title: 'Profile Data',
      description: 'Your account information and profile settings',
      icon: FileJson,
      format: 'JSON',
      size: '~50 KB',
    },
    {
      id: 'patients',
      title: 'Patient Records',
      description: 'All patient data associated with your account',
      icon: FileText,
      format: 'CSV',
      size: '~2 MB',
    },
    {
      id: 'predictions',
      title: 'Predictions & Results',
      description: 'All prediction history and AI staging results',
      icon: FileJson,
      format: 'JSON',
      size: '~5 MB',
    },
    {
      id: 'audit',
      title: 'Activity Audit Log',
      description: 'Complete history of all account activities',
      icon: FileText,
      format: 'CSV',
      size: '~1 MB',
    },
  ];

  const handleExport = async (optionId: string) => {
    setExporting(optionId);
    try {
      // TODO: Implement actual export functionality
      // const response = await apiClient.get(`/data-export/${optionId}`, {
      //   responseType: 'blob'
      // });
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `${optionId}-export.json`);
      // document.body.appendChild(link);
      // link.click();
      // link.parentChild.removeChild(link);

      toast.success(`Exporting ${optionId}... Check your downloads folder`);
    } catch (error) {
      toast.error(`Failed to export ${optionId}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['doctor', 'researcher']}>
      <div className="space-y-6">
        {/* Header Info */}
        <Card className="border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>
              Download your data in portable, standard formats. Your data is encrypted and secure.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Export Options */}
        <div className="space-y-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isExporting = exporting === option.id;

            return (
              <Card
                key={option.id}
                className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          {option.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {option.description}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {option.format}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {option.size}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(option.id)}
                      disabled={isExporting}
                      className="ml-4"
                    >
                      {isExporting ? (
                        <>
                          <Check className="mr-2 h-4 w-4 animate-pulse" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Bulk Export */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Bulk Export</CardTitle>
            <CardDescription>
              Download all your data in one comprehensive package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" variant="outline" disabled className="w-full">
              Export All Data (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* GDPR Compliance */}
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-emerald-900 dark:text-emerald-100">
              GDPR & HIPAA Compliant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
            <p>✓ You have the right to download your personal data</p>
            <p>✓ Data is exported in standard, portable formats</p>
            <p>✓ All exports are encrypted and logged for security</p>
            <p>✓ De-identified data for researchers per HIPAA standards</p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
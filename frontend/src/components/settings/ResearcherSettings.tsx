"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, Key, Copy } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function ResearcherSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (settings?.roleSpecific?.researchPreferences) {
      setLocalSettings({ ...settings.roleSpecific.researchPreferences });
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (localSettings) {
      updateSettings.mutate({
        roleSpecific: {
          researchPreferences: localSettings,
        },
      });
    }
  };

  const generateApiKey = () => {
    const newKey = `sk_research_${Math.random().toString(36).substr(2, 32)}`;
    setApiKey(newKey);
    toast.success('API key generated. Copy it now - you won\'t see it again!');
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!localSettings) return null;

  return (
    <div className="space-y-6">
      {/* Research Preferences */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Research Preferences</CardTitle>
          <CardDescription>Configure your research workflow preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Default Data Export Format</Label>
            <Select
              value={localSettings.dataExportFormat || 'csv'}
              onValueChange={(val) => handleChange('dataExportFormat', val)}
            >
              <SelectTrigger id="exportFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Structured)</SelectItem>
                <SelectItem value="xml">XML (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Default format for data exports
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Batch Download
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Allow downloading multiple datasets in one archive
              </p>
            </div>
            <Switch
              checked={localSettings.batchDownload || false}
              onCheckedChange={(val) => handleChange('batchDownload', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                API Access
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enable programmatic access to de-identified data
              </p>
            </div>
            <Switch
              checked={localSettings.apiAccess || false}
              onCheckedChange={(val) => handleChange('apiAccess', val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Access */}
      {localSettings.apiAccess && (
        <Card className="border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-900 dark:text-purple-100">
              <Key className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription className="text-purple-800 dark:text-purple-200">
              Use your API key to programmatically access de-identified research data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!apiKey ? (
              <Button onClick={generateApiKey} variant="outline" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Generate API Key
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Your API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm break-all text-slate-900 dark:text-slate-50">
                      {showApiKey ? apiKey : '•'.repeat(32)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyApiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Keep your API key confidential. Don't share it or commit it to version control.
                  </p>
                </div>

                <Button onClick={generateApiKey} variant="outline" className="w-full" size="sm">
                  Regenerate Key
                </Button>
              </div>
            )}

            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">API Documentation</p>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                View API Docs (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Tools */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Research Tools</CardTitle>
          <CardDescription>Access research-specific features and resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Download Data Dictionary
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Access Sample Code (Python)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            View Research Guidelines
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Publication Examples
          </Button>
        </CardContent>
      </Card>

      {/* Data Access Info */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-base">Data Access Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>✓ Access to de-identified patient data only</p>
          <p>✓ All data stripped of PII per HIPAA Safe Harbor</p>
          <p>✓ Usage tracked and logged for audit purposes</p>
          <p>✓ Must comply with research ethics guidelines</p>
          <p>✓ Data retention: 7 years per HIPAA requirements</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setLocalSettings({ ...settings.roleSpecific?.researchPreferences })}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="gap-2"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
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
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';

export default function DoctorSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);

  useEffect(() => {
    if (settings?.roleSpecific?.clinicalPreferences) {
      setLocalSettings({ ...settings.roleSpecific.clinicalPreferences });
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
          clinicalPreferences: localSettings,
        },
      });
    }
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
      {/* Clinical Preferences */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Clinical Preferences</CardTitle>
          <CardDescription>Customize your clinical workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientView">Default Patient View</Label>
            <Select
              value={localSettings.defaultPatientView}
              onValueChange={(val) => handleChange('defaultPatientView', val)}
            >
              <SelectTrigger id="patientView">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="grid">Grid View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Auto-Save Drafts
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatically save prediction drafts every 30 seconds
              </p>
            </div>
            <Switch
              checked={localSettings.autoSaveDrafts}
              onCheckedChange={(val) => handleChange('autoSaveDrafts', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Prediction Notifications
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notify when predictions are completed or failed
              </p>
            </div>
            <Switch
              checked={localSettings.predictionNotifications}
              onCheckedChange={(val) => handleChange('predictionNotifications', val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clinical Tools */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Clinical Tools</CardTitle>
          <CardDescription>Quick access to useful clinical resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            TNM Staging Reference
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Clinical Guidelines
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Prediction Template Library
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Patient Consent Forms
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={() => setLocalSettings({ ...settings.roleSpecific?.clinicalPreferences })}
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
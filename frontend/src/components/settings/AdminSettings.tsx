"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSettings, useUpdateSettings, useResetSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);

  useEffect(() => {
    if (settings?.roleSpecific?.systemMonitoring) {
      setLocalSettings({ ...settings.roleSpecific.systemMonitoring });
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
          systemMonitoring: localSettings,
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
      {/* System Monitoring */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">System Monitoring</CardTitle>
          <CardDescription>Configure system-wide monitoring preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Auto Alerts
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatic alerts for critical system events
              </p>
            </div>
            <Switch
              checked={localSettings.autoAlerts}
              onCheckedChange={(val) => handleChange('autoAlerts', val)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <Input
              id="alertThreshold"
              type="number"
              value={localSettings.alertThreshold}
              onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value))}
              min={1}
              max={100}
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System health percentage below which alerts are triggered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Controls */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Admin Controls</CardTitle>
          <CardDescription>Bulk actions and system management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            View System Logs
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Backup Database
          </Button>
          <Button variant="outline" className="w-full justify-start">
            View API Usage
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Manage Roles & Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Reset Options */}
      <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Reset Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30"
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                resetSettings.mutate();
              }
            }}
            disabled={resetSettings.isPending}
          >
            {resetSettings.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset All Settings to Defaults'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocalSettings({ ...settings.roleSpecific?.systemMonitoring })}>
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
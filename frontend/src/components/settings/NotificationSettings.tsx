"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);

  useEffect(() => {
    if (settings?.notifications) {
      setLocalSettings({ ...settings.notifications });
    }
  }, [settings]);

  const handleToggle = (path: string, value: boolean) => {
    const keys = path.split('.');
    setLocalSettings((prev: any) => {
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = () => {
    if (localSettings) {
      updateSettings.mutate({ notifications: localSettings });
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
      {/* Email Notifications */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Email Notifications</CardTitle>
          <CardDescription>Control what emails you receive from OncoVisionX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Prediction Notifications
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get notified when predictions are completed
              </p>
            </div>
            <Switch
              checked={localSettings.email.predictions}
              onCheckedChange={(val) => handleToggle('email.predictions', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                System Alerts
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Important system notifications and updates
              </p>
            </div>
            <Switch
              checked={localSettings.email.systemAlerts}
              onCheckedChange={(val) => handleToggle('email.systemAlerts', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Weekly Reports
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receive weekly summary reports
              </p>
            </div>
            <Switch
              checked={localSettings.email.weeklyReports}
              onCheckedChange={(val) => handleToggle('email.weeklyReports', val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">In-App Notifications</CardTitle>
          <CardDescription>Control notifications shown in the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Prediction Updates
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notifications about prediction status changes
              </p>
            </div>
            <Switch
              checked={localSettings.inApp.predictions}
              onCheckedChange={(val) => handleToggle('inApp.predictions', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                System Alerts
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Critical system events and alerts
              </p>
            </div>
            <Switch
              checked={localSettings.inApp.systemAlerts}
              onCheckedChange={(val) => handleToggle('inApp.systemAlerts', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Messages
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Direct messages and collaboration updates
              </p>
            </div>
            <Switch
              checked={localSettings.inApp.messages}
              onCheckedChange={(val) => handleToggle('inApp.messages', val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocalSettings({ ...settings.notifications })}>
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
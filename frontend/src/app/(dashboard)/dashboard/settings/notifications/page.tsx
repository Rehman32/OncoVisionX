"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  channels: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'predictions',
    title: 'Prediction Completed',
    description: 'Receive notifications when AI predictions are complete',
    channels: { email: true, inApp: true, sms: false },
  },
  {
    id: 'patients',
    title: 'Patient Updates',
    description: 'Get notified when patient information is updated',
    channels: { email: true, inApp: true, sms: false },
  },
  {
    id: 'security',
    title: 'Security Alerts',
    description: 'Important security events and suspicious activities',
    channels: { email: true, inApp: true, sms: true },
  },
  {
    id: 'maintenance',
    title: 'System Maintenance',
    description: 'Notifications about scheduled maintenance and updates',
    channels: { email: true, inApp: false, sms: false },
  },
  {
    id: 'reports',
    title: 'Weekly Reports',
    description: 'Receive weekly summary reports',
    channels: { email: true, inApp: false, sms: false },
  },
];

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const toggleChannel = (settingId: string, channel: 'email' | 'inApp' | 'sms') => {
    setSettings((prevSettings) =>
      prevSettings.map((setting) =>
        setting.id === settingId
          ? {
              ...setting,
              channels: {
                ...setting.channels,
                [channel]: !setting.channels[channel],
              },
            }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to API
      // await apiClient.put('/auth/notification-preferences', settings);
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Email Notifications */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which notifications you'd like to receive via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{setting.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {setting.description}
                  </p>
                </div>
                <Button
                  variant={setting.channels.email ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleChannel(setting.id, 'email')}
                >
                  {setting.channels.email ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Choose which notifications you'd like to see in the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((setting) => (
              <div
                key={`inapp-${setting.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{setting.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {setting.description}
                  </p>
                </div>
                <Button
                  variant={setting.channels.inApp ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleChannel(setting.id, 'inApp')}
                >
                  {setting.channels.inApp ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Choose which notifications you'd like to receive via SMS (for important alerts only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings
              .filter((s) => s.channels.sms !== undefined)
              .map((setting) => (
                <div
                  key={`sms-${setting.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{setting.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <Button
                    variant={setting.channels.sms ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleChannel(setting.id, 'sms')}
                  >
                    {setting.channels.sms ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>

        <Separator />

        <Button onClick={handleSave} size="lg" disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </ProtectedRoute>
  );
}
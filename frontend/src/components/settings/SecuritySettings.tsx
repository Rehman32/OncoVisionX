"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle, Lock, LogOut } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';

export default function SecuritySettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);

  useEffect(() => {
    if (settings?.security) {
      setLocalSettings({ ...settings.security });
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
      updateSettings.mutate({ security: localSettings });
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
      {/* Two-Factor Authentication */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                2FA Status
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {localSettings.twoFactorEnabled
                  ? '✓ Two-factor authentication is enabled'
                  : 'Not yet enabled'}
              </p>
            </div>
            <Switch
              checked={localSettings.twoFactorEnabled}
              onCheckedChange={(val) => handleChange('twoFactorEnabled', val)}
            />
          </div>

          {localSettings.twoFactorEnabled && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-800 dark:text-green-300">
                2FA is active. You'll be asked to verify with your authenticator app or email code on next login.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Session Management</CardTitle>
          <CardDescription>Control session timeout and active sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={localSettings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
              min={5}
              max={480}
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You'll be automatically logged out after this period of inactivity
            </p>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <h4 className="font-medium text-sm mb-3 text-slate-900 dark:text-slate-50">
              Active Sessions
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-50">Current Device</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This browser</p>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Other Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Login Alerts */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg">Login Alerts</CardTitle>
          <CardDescription>Get notified about account login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Email on New Login
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receive an email when your account is accessed from a new device
              </p>
            </div>
            <Switch
              checked={localSettings.loginAlerts}
              onCheckedChange={(val) => handleChange('loginAlerts', val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-red-700 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400/80">
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => alert('Password change functionality would be implemented here')}
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => alert('Account deletion would be handled with confirmation')}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocalSettings({ ...settings.security })}>
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
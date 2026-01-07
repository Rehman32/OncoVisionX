"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PrivacySettingsPage() {
  const handleDataAccess = () => {
    toast.info('Data access settings coming soon');
  };

  const handleDeleteAccount = () => {
    toast.error('Proceed with caution. This action cannot be undone.');
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Privacy Controls */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy Controls
            </CardTitle>
            <CardDescription>
              Manage who can see your information and activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">Profile Visibility</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Control who can view your profile
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">Activity Privacy</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Control visibility of your recent activity
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Data & Storage
            </CardTitle>
            <CardDescription>
              Manage your data and storage preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">Data Retention</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Your data is retained for 7 years per HIPAA regulations
                </p>
              </div>
              <Badge className="bg-blue-600">Compliant</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-50">Encryption Status</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  All data is encrypted end-to-end (AES-256)
                </p>
              </div>
              <Badge className="bg-emerald-600">Encrypted</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data Download */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Download Your Data</CardTitle>
            <CardDescription>
              Export all your personal data in a portable format (GDPR compliance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Request Data Export
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/30">
              <p className="font-medium text-slate-900 dark:text-slate-50 mb-2">Delete Account</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full"
              >
                Delete Account Permanently
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
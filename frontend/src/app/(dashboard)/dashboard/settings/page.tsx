"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, Lock, FileText, BarChart3,
  Palette, Fingerprint,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfileSettings from '@/components/settings/ProfileSettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import DoctorSettings from '@/components/settings/DoctorSettings';
import AuditLogsSettings from '@/components/settings/AuditLogsSettings';
import SystemHealthSettings from '@/components/settings/SystemHealthSettings';
import PasswordAndSecuritySettings from '@/components/settings/PasswordAndSecurity';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  
  // Get initial tab from URL query param ?tab=profile, default to 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab && ['profile', 'security', 'display', 'audit-logs', 'system', 'clinical'].includes(tab)
      ? tab
      : 'profile';
  });

  // Sync tab with URL query param (optional deep linking)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'display', 'audit-logs', 'system', 'clinical'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Define tabs based on role
  const getTabsForRole = () => {
    const commonTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Password & Security', icon: Lock },
      { id: 'display', label: 'Display', icon: Palette },
    ];

    if (user?.role === 'admin') {
      return [
        ...commonTabs,
        { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        { id: 'system', label: 'System Health', icon: BarChart3 },
      ];
    } else if (user?.role === 'doctor') {
      return [
        ...commonTabs,
        { id: 'clinical', label: 'Clinical', icon: Fingerprint },
      ];
    }

    return commonTabs;
  };

  const tabs = getTabsForRole();

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor']}>
      <div className="space-y-6">
        {/* Tabs Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <div className="border-b border-slate-200 dark:border-slate-800">
            <TabsList className="w-full h-auto rounded-none bg-transparent p-0 gap-0">
              {tabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={`
                    relative h-14 rounded-none border-b-2 transition-all duration-200
                    data-[state=active]:border-primary data-[state=inactive]:border-transparent
                    data-[state=active]:bg-transparent data-[state=inactive]:bg-transparent
                    data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50
                    data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400
                    hover:text-slate-900 dark:hover:text-slate-200
                    px-4 font-medium text-sm flex items-center gap-2
                    flex-1 sm:flex-none justify-center sm:justify-start
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <div className="p-6 md:p-8">
            {/* Common tabs */}
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="display" className="space-y-6">
              <DisplaySettings />
            </TabsContent>
            <TabsContent value="security" className="space-y-6">
              <PasswordAndSecuritySettings />
            </TabsContent>

            {/* Admin-specific tabs */}
            {user?.role === 'admin' && (
              <>
                <TabsContent value="audit-logs" className="space-y-6">
                  <AuditLogsSettings />
                </TabsContent>
                <TabsContent value="system" className="space-y-6">
                  <SystemHealthSettings />
                </TabsContent>
              </>
            )}

            {/* Doctor-specific tabs */}
            {user?.role === 'doctor' && (
              <TabsContent value="clinical" className="space-y-6">
                <DoctorSettings />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

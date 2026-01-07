"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Lock,
  Eye,
  Palette,
  Zap,
  User,
  Key,
  LogOut,
  Download,
  Shield,
  Fingerprint,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import AdminSettings from '@/components/settings/AdminSettings';
import DoctorSettings from '@/components/settings/DoctorSettings';
import ResearcherSettings from '@/components/settings/ResearcherSettings';
import DataExportSettings from '@/components/settings/DataExportSettings';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Define tabs based on user role
  const getTabsForRole = () => {
    const commonTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'privacy', label: 'Privacy', icon: Eye },
      { id: 'display', label: 'Display', icon: Palette },
      { id: 'security', label: 'Security', icon: Lock },
    ];

    if (user?.role === 'admin') {
      return [
        ...commonTabs,
        { id: 'admin', label: 'System', icon: Zap },
      ];
    } else if (user?.role === 'doctor') {
      return [
        ...commonTabs,
        { id: 'clinical', label: 'Clinical', icon: Fingerprint },
      ];
    } else if (user?.role === 'researcher') {
      return [
        ...commonTabs,
        { id: 'research', label: 'Research', icon: Download },
        { id: 'data-export', label: 'Data Export', icon: Download },
      ];
    }

    return commonTabs;
  };

  const tabs = getTabsForRole();

  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'researcher']}>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Settings
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400">
            Manage your account preferences, security, and application settings
          </p>
        </div>

        {/* Main Settings Container */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
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
              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <ProfileSettings />
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <NotificationSettings />
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <PrivacySettings />
              </TabsContent>

              {/* Display Tab */}
              <TabsContent value="display" className="space-y-6">
                <DisplaySettings />
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <SecuritySettings />
              </TabsContent>

              {/* Admin System Settings */}
              {user?.role === 'admin' && (
                <TabsContent value="admin" className="space-y-6">
                  <AdminSettings />
                </TabsContent>
              )}

              {/* Doctor Clinical Settings */}
              {user?.role === 'doctor' && (
                <TabsContent value="clinical" className="space-y-6">
                  <DoctorSettings />
                </TabsContent>
              )}

              {/* Researcher Settings */}
              {user?.role === 'researcher' && (
                <>
                  <TabsContent value="research" className="space-y-6">
                    <ResearcherSettings />
                  </TabsContent>

                  <TabsContent value="data-export" className="space-y-6">
                    <DataExportSettings />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
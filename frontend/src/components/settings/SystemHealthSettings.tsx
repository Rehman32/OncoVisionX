"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Server,
  Database,
  HardDrive,
  ActivitySquare,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  uptime: string;
  latency?: string;
}

interface BackupInfo {
  date: string;
  size: string;
  status: 'completed' | 'in-progress' | 'failed';
}

const systemServices: SystemStatus[] = [
  {
    name: 'API Server',
    status: 'healthy',
    icon: Server,
    uptime: '99.9%',
    latency: '45ms',
  },
  {
    name: 'Database',
    status: 'healthy',
    icon: Database,
    uptime: '99.95%',
    latency: '12ms',
  },
  {
    name: 'ML Service',
    status: 'healthy',
    icon: ActivitySquare,
    uptime: '99.8%',
    latency: '250ms',
  },
  {
    name: 'File Storage',
    status: 'healthy',
    icon: HardDrive,
    uptime: '100%',
    latency: '80ms',
  },
];

const backupHistory: BackupInfo[] = [
  {
    date: 'Jan 6, 2026 - 02:00 AM',
    size: '12.5 GB',
    status: 'completed',
  },
  {
    date: 'Jan 5, 2026 - 02:00 AM',
    size: '12.3 GB',
    status: 'completed',
  },
  {
    date: 'Jan 4, 2026 - 02:00 AM',
    size: '12.1 GB',
    status: 'completed',
  },
  {
    date: 'Jan 3, 2026 - 02:00 AM',
    size: '11.9 GB',
    status: 'completed',
  },
];

export default function SystemHealthSettings() {
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const handleSystemCheck = async () => {
    setIsRunningCheck(true);
    toast.loading('Running system diagnostics...');
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success('All systems operational and healthy');
    } catch (error) {
      toast.dismiss();
      toast.error('System check failed');
    } finally {
      setIsRunningCheck(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Overall Status */}
        <Card className="border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <CheckCircle2 className="h-6 w-6" />
                  System Status
                </CardTitle>
                <CardDescription className="text-emerald-800 dark:text-emerald-200 mt-1">
                  All systems operational and performing optimally
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSystemCheck} 
                size="sm"
                disabled={isRunningCheck}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
                {isRunningCheck ? 'Checking...' : 'Run Check'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Service Status */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Service Status
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {systemServices.map((service) => {
              const Icon = service.icon;
              const isHealthy = service.status === 'healthy';
              const statusColor = isHealthy
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

              return (
                <Card
                  key={service.name}
                  className="border-slate-200 dark:border-slate-800"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">
                            {service.name}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColor}>
                        {service.status === 'healthy' ? 'Healthy' : 'Warning'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Uptime</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {service.uptime}
                        </span>
                      </div>
                      {service.latency && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Latency</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">
                            {service.latency}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            System Metrics
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Database Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">62%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: '62%' }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  62 GB / 100 GB
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: '28%' }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Normal load
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{ width: '45%' }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  8.1 GB / 16 GB
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Network I/O
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">420 MB</div>
                <p className="text-xs text-slate-500 mt-2">
                  Per minute average
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Backups</CardTitle>
                <CardDescription>
                  Automated daily backups ensure data safety and compliance
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled>
                Backup Now
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {backupHistory.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {backup.date}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {backup.size}
                  </p>
                </div>
                <Badge className={getStatusBadgeColor(backup.status)}>
                  {backup.status === 'completed'
                    ? 'Completed'
                    : backup.status === 'in-progress'
                    ? 'In Progress'
                    : 'Failed'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
            <CardDescription>
              Planned maintenance windows for system updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    Scheduled Maintenance
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Sunday, Jan 12, 2026 - 2:00 AM to 4:00 AM UTC
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    System will be unavailable during this window. We recommend scheduling important tasks outside this time.
                  </p>
                </div>
                <Badge className="bg-blue-600">Upcoming</Badge>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    Last Maintenance
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Sunday, Dec 29, 2025 - 2:00 AM to 2:45 AM UTC
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Completed successfully. Database optimization and security patches applied.
                  </p>
                </div>
                <Badge className="bg-emerald-600">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs & Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Logs & Monitoring</CardTitle>
            <CardDescription>
              Access detailed system logs and monitoring data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              View Error Logs (Coming Soon)
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              View Performance Metrics (Coming Soon)
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              View Security Logs (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

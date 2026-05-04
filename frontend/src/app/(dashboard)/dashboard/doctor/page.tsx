"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import { Users, Activity, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(5);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const stats = (statsData as any)?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Your patients and triage requests</p>
        </div>
        <Button onClick={() => router.push('/dashboard/patients/new')}>
          Add Patient
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.myPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Patients assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.myPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">Total triage requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.decisionBreakdown?.accept || 0}
            </div>
            <p className="text-xs text-muted-foreground">High-confidence results</p>
          </CardContent>
        </Card>
      </div>

      {/* Decision Breakdown */}
      <h2 className="text-xl font-semibold tracking-tight">Triage Decision Breakdown</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Auto-Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.decisionBreakdown?.accept || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Deferred to You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.decisionBreakdown?.deferToDoctor || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Quality Rejects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.decisionBreakdown?.rejectQuality || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              OOD Rejects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.decisionBreakdown?.rejectOod || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="space-y-4">
              {(activityData as any)?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                (activityData as any)?.data?.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      router.push(`/dashboard/predictions/${activity.id || activity.predictionId}`);
                    }}
                  >
                    <div className="rounded-full bg-muted p-2">
                      {activity.decision === 'ACCEPT' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : activity.decision === 'DEFER_TO_DOCTOR' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        Triage: {activity.predictedClass?.toUpperCase() || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                        </p>
                        {activity.decision && (
                          <Badge variant="outline" className="text-xs">
                            {activity.decision}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

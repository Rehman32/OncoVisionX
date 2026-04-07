"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import { Users, Activity, FileText, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  // `stats` matches our updated backend schema 
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(8);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const stats = statsData?.data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
        <p className="text-muted-foreground">Global administrative overview of triage load and subsystem health</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">Active patient records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">All-time inferences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clinical & Administrative staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Traffic</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.predictionsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Inferences past 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Status Breakdown */}
      <h2 className="text-xl font-semibold mt-8 mb-2 tracking-tight">Triage Decision Breakdown</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.decisionBreakdown?.accept || 0}
            </div>
            <p className="text-xs text-muted-foreground">Confident Inference</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deferred</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.decisionBreakdown?.deferToDoctor || 0}
            </div>
            <p className="text-xs text-muted-foreground">Required human review</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rejects</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.decisionBreakdown?.rejectQuality || 0}
            </div>
             <p className="text-xs text-muted-foreground">Blurred / Low-res inputs</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out-of-Distribution</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.decisionBreakdown?.rejectOod || 0}
            </div>
            <p className="text-xs text-muted-foreground">Anomalous / non-derma inputs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <h2 className="text-xl font-semibold mt-8 mb-2 tracking-tight">Recent Activity Stream</h2>
      <Card>
        <CardContent className="pt-6">
          {activityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="space-y-4">
              {activityData?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                activityData?.data?.map((activity: any) => {
                  const isPatient = activity.type === 'patient_registered';
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => {
                        if (isPatient) {
                          router.push(`/dashboard/patients/${activity.metadata?.patientId}`);
                        } else {
                          // Note: standard activity structure from backend maps directly to ID
                          router.push(`/dashboard/predictions/${activity.id || activity.predictionId}`);
                        }
                      }}
                    >
                      <div className="rounded-full bg-muted p-2">
                        {isPatient ? (
                          <Users className="h-4 w-4 text-blue-500" />
                        ) : activity.decision === 'ACCEPT' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : activity.decision === 'DEFER_TO_DOCTOR' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {isPatient ? "Patient Registered" : `Triage Inference Completed`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPatient ? "New patient added to system" : `Predicted Class: ${activity.predictedClass?.toUpperCase() || 'UNKNOWN'}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1"/>
                            {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                          {activity.decision && (
                            <Badge variant="outline" className={`text-xs ml-2 ${activity.decision === 'ACCEPT' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {activity.decision}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

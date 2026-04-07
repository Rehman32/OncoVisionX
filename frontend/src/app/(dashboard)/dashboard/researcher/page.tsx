"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboard';
import { Users, Activity, BarChart3, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ResearcherDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

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

  const stats = statsData?.data;

  // Anatomical site distribution from new backend
  const siteDistribution: Record<string, number> = stats?.anatomicalSiteDistribution || {};
  const totalSites = Object.values(siteDistribution).reduce((sum: number, count: number) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Dashboard</h1>
        <p className="text-muted-foreground">
          Aggregated analytics for research purposes (de-identified data)
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Researcher View — De-identified Data
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                All patient data is anonymized. Only aggregated statistics and clinical metrics are available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">De-identified cohort size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">CDSS triage analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sites</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(siteDistribution).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Anatomical sites represented
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Decision Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Triage Decision Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            Three-Way Decision outcomes across completed predictions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Accepted (High Confidence)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {stats?.decisionBreakdown?.accept || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Deferred to Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats?.decisionBreakdown?.deferToDoctor || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejected (Quality)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats?.decisionBreakdown?.rejectQuality || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejected (Out of Distribution)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats?.decisionBreakdown?.rejectOod || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Anatomical Site Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Anatomical Site Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            HAM10000-classified lesion site breakdown across the patient cohort
          </p>
        </CardHeader>
        <CardContent>
          {Object.keys(siteDistribution).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No patient data yet</p>
              <p className="text-xs mt-1">Site distribution will appear as patients are registered</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(siteDistribution)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([site, count]) => {
                  const percentage = totalSites > 0 ? Math.round(((count as number) / totalSites) * 100) : 0;
                  return (
                    <div key={site} className="flex items-center gap-3">
                      <span className="text-sm font-medium capitalize w-36 truncate">{site}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 min-w-[80px] justify-end">
                        <Badge variant="secondary">{count as number}</Badge>
                        <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Note */}
      <Card>
        <CardHeader>
          <CardTitle>Data Access & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>HIPAA Compliance:</strong> All patient identifiable information (PII) has been removed 
            from this view in accordance with HIPAA Safe Harbor method.
          </p>
          <p>
            <strong>Available Data:</strong> You have access to aggregated statistics, triage decision outcomes, 
            anatomical site distributions, and de-identified prediction metrics.
          </p>
          <p>
            <strong>Restrictions:</strong> Individual patient records, names, contact information, 
            and assigned physicians are not accessible in researcher mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

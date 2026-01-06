"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/useDashboard';
import { Users, Activity, BarChart3, TrendingUp } from 'lucide-react';
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

  // Calculate stage distribution percentages
  const stageDistribution = stats?.analytics?.stageDistribution || {};
  const totalStaged = Object.values(stageDistribution).reduce((sum: number, count: any) => sum + count, 0);

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
                {stats?.message || 'Researcher View - De-identified Data'}
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
            <div className="text-2xl font-bold">{stats?.overview?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">De-identified cohort size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.totalPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">ML staging analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.overview?.completedPredictions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.overview?.totalPredictions 
                ? `${Math.round((stats.overview.completedPredictions / stats.overview.totalPredictions) * 100)}% completion rate`
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cancer Stage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Cancer Stage Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">
            TNM staging results across completed predictions (AJCC 8th Edition)
          </p>
        </CardHeader>
        <CardContent>
          {Object.keys(stageDistribution).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No completed predictions yet</p>
              <p className="text-xs mt-1">Stage distribution will appear as predictions are completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stage Groups */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Early Stage (I) */}
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                      Early Stage (I)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['IA1', 'IA2', 'IA3', 'IB'].map((stage) => (
                        stageDistribution[stage] ? (
                          <div key={stage} className="flex justify-between items-center">
                            <span className="text-sm font-medium">Stage {stage}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {stageDistribution[stage]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((stageDistribution[stage] / totalStaged) * 100)}%
                              </span>
                            </div>
                          </div>
                        ) : null
                      ))}
                      {!['IA1', 'IA2', 'IA3', 'IB'].some(s => stageDistribution[s]) && (
                        <p className="text-xs text-muted-foreground">No Stage I cases</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Locally Advanced (II-III) */}
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Locally Advanced (II-III)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['IIA', 'IIB', 'IIIA', 'IIIB', 'IIIC'].map((stage) => (
                        stageDistribution[stage] ? (
                          <div key={stage} className="flex justify-between items-center">
                            <span className="text-sm font-medium">Stage {stage}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {stageDistribution[stage]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((stageDistribution[stage] / totalStaged) * 100)}%
                              </span>
                            </div>
                          </div>
                        ) : null
                      ))}
                      {!['IIA', 'IIB', 'IIIA', 'IIIB', 'IIIC'].some(s => stageDistribution[s]) && (
                        <p className="text-xs text-muted-foreground">No Stage II-III cases</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced/Metastatic (IV) */}
                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                      Advanced/Metastatic (IV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['IVA', 'IVB'].map((stage) => (
                        stageDistribution[stage] ? (
                          <div key={stage} className="flex justify-between items-center">
                            <span className="text-sm font-medium">Stage {stage}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {stageDistribution[stage]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((stageDistribution[stage] / totalStaged) * 100)}%
                              </span>
                            </div>
                          </div>
                        ) : null
                      ))}
                      {!['IVA', 'IVB'].some(s => stageDistribution[s]) && (
                        <p className="text-xs text-muted-foreground">No Stage IV cases</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Summary Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Staged</span>
                        <span className="text-lg font-bold">{totalStaged}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Unique Stages</span>
                        <span className="text-lg font-bold">
                          {Object.keys(stageDistribution).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Most Common</span>
                        <Badge>
                          Stage {
                            Object.entries(stageDistribution).reduce((a, b) => 
                              (b[1] as number) > (a[1] as number) ? b : a
                            )[0]
                          }
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
            <strong>Available Data:</strong> You have access to aggregated statistics, clinical parameters, 
            staging results, and de-identified imaging features.
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

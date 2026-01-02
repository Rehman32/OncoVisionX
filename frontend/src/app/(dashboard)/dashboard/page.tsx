import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | OncoVisionX',
};

export default function DashboardPage() {
  // TODO: Fetch real stats from API
  const stats = [
    {
      title: 'Total Patients',
      value: '124',
      change: '+12%',
      changeValue: '+14 patients',
      icon: Users,
      changeType: 'positive' as const,
    },
    {
      title: 'Predictions This Month',
      value: '48',
      change: '+23%',
      changeValue: '+9 predictions',
      icon: FileText,
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Reviews',
      value: '7',
      change: '-5%',
      changeValue: '-1 review',
      icon: Activity,
      changeType: 'negative' as const,
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      changeValue: '+2.1 percentage points',
      icon: TrendingUp,
      changeType: 'positive' as const,
    },
  ];

  const recentPredictions = [
    {
      id: 'P-2025-045',
      stage: 'Stage IIIA',
      status: 'completed' as const,
      confidence: '96.8%',
      date: '2 hours ago'
    },
    {
      id: 'P-2025-044',
      stage: 'Stage IB',
      status: 'completed' as const,
      confidence: '94.2%',
      date: '5 hours ago'
    },
    {
      id: 'P-2025-043',
      stage: 'Processing...',
      status: 'processing' as const,
      confidence: null,
      date: 'Just now'
    },
  ];

  const quickActions = [
    {
      title: 'Create New Patient',
      description: 'Add a new patient to the system',
      icon: Users,
      href: '/dashboard/patients/new',
    },
    {
      title: 'New Prediction',
      description: 'Upload data for cancer staging',
      icon: FileText,
      href: '/dashboard/predictions/new',
    },
    {
      title: 'View Reports',
      description: 'Access prediction reports and analytics',
      icon: TrendingUp,
      href: '/dashboard/reports',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Overview
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Monitor your cancer staging system performance and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.changeType === 'positive' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card 
              key={stat.title} 
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900">
                  <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {stat.value}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.changeType === 'positive' 
                      ? 'text-emerald-600 dark:text-emerald-500' 
                      : 'text-red-600 dark:text-red-500'
                  }`}>
                    <ChangeIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    vs last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Predictions */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPredictions.map((prediction) => (
                <div 
                  key={prediction.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      prediction.status === 'completed' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                        : 'bg-amber-50 dark:bg-amber-950/30'
                    }`}>
                      {prediction.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
                        Patient {prediction.id}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {prediction.stage}
                        {prediction.confidence && (
                          <span className="text-slate-400 dark:text-slate-500"> • {prediction.confidence} confidence</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {prediction.date}
                    </span>
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                      prediction.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {prediction.status === 'completed' ? 'Completed' : 'Processing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button 
                  key={action.title}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
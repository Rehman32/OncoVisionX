import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | CancerVision360',
};

export default function DashboardPage() {
  // TODO: Fetch real stats from API
  const stats = [
    {
      title: 'Total Patients',
      value: '124',
      change: '+12%',
      icon: Users,
      changeType: 'positive' as const,
    },
    {
      title: 'Predictions This Month',
      value: '48',
      change: '+23%',
      icon: FileText,
      changeType: 'positive' as const,
    },
    {
      title: 'Pending Reviews',
      value: '7',
      change: '-5%',
      icon: Activity,
      changeType: 'negative' as const,
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      icon: TrendingUp,
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your cancer staging system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Patient P-2025-045</p>
                  <p className="text-sm text-muted-foreground">Stage IIIA</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Patient P-2025-044</p>
                  <p className="text-sm text-muted-foreground">Stage IB</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Patient P-2025-043</p>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Processing
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
              <p className="font-medium">Create New Patient</p>
              <p className="text-sm text-muted-foreground">Add a new patient to the system</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
              <p className="font-medium">New Prediction</p>
              <p className="text-sm text-muted-foreground">Upload data for cancer staging</p>
            </button>
            <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
              <p className="font-medium">View Reports</p>
              <p className="text-sm text-muted-foreground">Access prediction reports</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

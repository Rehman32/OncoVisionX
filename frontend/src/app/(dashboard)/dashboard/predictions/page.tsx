"use client";

import { useRouter } from 'next/navigation';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileText, ArrowRight, Activity, Clock } from 'lucide-react';

export default function PredictionsListPage() {
  const router = useRouter();
  const { data, isLoading } = usePredictions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions</h1>
          <p className="text-muted-foreground">History of AI staging analysis</p>
        </div>
        {/* Note: Usually you start a prediction FROM a patient, but we could add a general button here if needed */}
        <Button onClick={() => router.push('/dashboard/patients')}>
          New Prediction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((pred) => (
          <Card key={pred._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/predictions/${pred._id}`)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {(pred.patient as any)?.personalInfo?.firstName} {(pred.patient as any)?.personalInfo?.lastName}
              </CardTitle>
              {pred.status === 'completed' ? (
                <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
              ) : pred.status === 'processing' ? (
                <Badge variant="secondary" className="animate-pulse">Processing</Badge>
              ) : (
                <Badge variant="outline">{pred.status}</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{pred.predictionId}</span>
                </div>
                
                {pred.results ? (
                  <div className="p-3 bg-muted rounded-md text-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall Stage</span>
                    <div className="text-2xl font-bold text-primary">
                      {pred.results.tnmStaging.overallStage}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {(pred.results.tnmStaging.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md text-center h-[88px] flex items-center justify-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" /> 
                      {pred.status === 'processing' ? 'Analysis in progress...' : 'Pending start'}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(pred.createdAt), 'MMM d, yyyy')}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    View <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!data?.data || data.data.length === 0) && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No predictions yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Select a patient to generate your first AI staging report.</p>
            <Button onClick={() => router.push('/dashboard/patients')}>Go to Patients</Button>
          </div>
        )}
      </div>
    </div>
  );
}

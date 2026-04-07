"use client";

import { useRouter } from 'next/navigation';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { FileText, ArrowRight, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { DecisionType } from '@/types/prediction';

function getDecisionBadge(decision?: DecisionType) {
  if (!decision) return <Badge variant="outline">Unknown</Badge>;
  switch (decision) {
    case 'ACCEPT':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Accept</Badge>;
    case 'DEFER_TO_DOCTOR':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Defer</Badge>;
    case 'REJECT_QUALITY':
      return <Badge variant="destructive">Quality Reject</Badge>;
    case 'REJECT_OOD':
      return <Badge variant="destructive">OOD Reject</Badge>;
    default:
      return <Badge variant="outline">{decision}</Badge>;
  }
}

function getDecisionIcon(decision?: DecisionType) {
  switch (decision) {
    case 'ACCEPT':
      return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    case 'DEFER_TO_DOCTOR':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'REJECT_QUALITY':
    case 'REJECT_OOD':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return null;
  }
}

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
          <p className="text-muted-foreground">History of CDSS triage analyses</p>
        </div>
        <Button onClick={() => router.push('/dashboard/patients')}>
          New Prediction
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((pred) => {
          if (!pred) return null;
          const patient = typeof pred.patient === 'object' ? pred.patient : null;
          const patientName = patient
            ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
            : 'Unknown Patient';

          return (
            <Card key={pred._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/predictions/${pred._id}`)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {patientName}
                </CardTitle>
                {getDecisionBadge(pred.decision)}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{pred.predictionId}</span>
                  </div>
                  
                  {pred.status === 'completed' && pred.decision ? (
                    <div className="p-3 bg-muted rounded-md text-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Decision</span>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {getDecisionIcon(pred.decision)}
                        <span className="text-lg font-bold">
                          {pred.predictedClass?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Confidence: {pred.confidence != null ? (pred.confidence * 100).toFixed(1) : '0.0'}%
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md text-center h-[88px] flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        {pred.status === 'failed' ? 'Analysis failed' : 'Processing...'}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pred.createdAt ? format(new Date(pred.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      View <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!data?.data || data.data.length === 0) && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No predictions yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Select a patient to generate your first triage report.</p>
            <Button onClick={() => router.push('/dashboard/patients')}>Go to Patients</Button>
          </div>
        )}
      </div>
    </div>
  );
}

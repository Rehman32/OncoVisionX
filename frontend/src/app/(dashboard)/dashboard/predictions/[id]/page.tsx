"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrediction } from "@/hooks/usePredictions";
import { format } from "date-fns";
import TNMStageDisplay from "@/components/predictions/TNMStageDisplay";
import SurvivalChart from "@/components/predictions/SurvivalChart";
import FeatureImportanceChart from "@/components/predictions/FeatureImportanceChart";

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = usePrediction(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Prediction not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The prediction you're looking for doesn't exist.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/predictions")}
          >
            Back to Predictions
          </Button>
        </div>
      </div>
    );
  }

  const prediction = data.data;
  const patient =
    typeof prediction.patient === "object" ? prediction.patient : null;
  const requestedBy =
    typeof prediction.requestedBy === "object" ? prediction.requestedBy : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Prediction Report
              </h1>
              <Badge variant="outline" className="font-mono">
                {prediction.predictionId}
              </Badge>
              {prediction.status === "completed" && (
                <Badge className="bg-green-500">Completed</Badge>
              )}
              {prediction.status === "processing" && (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Processing
                </Badge>
              )}
              {prediction.status === "failed" && (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              AI-generated staging analysis for{" "}
              {patient?.personalInfo.firstName} {patient?.personalInfo.lastName}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">
                  {patient?.personalInfo.firstName}{" "}
                  {patient?.personalInfo.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Requested By</p>
                <p className="font-medium">
                  {requestedBy?.firstName} {requestedBy?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(prediction.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>
            {prediction.processingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Processing Time</p>
                  <p className="font-medium">
                    {prediction.processingTime.toFixed(1)}s
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {prediction.status === "processing" && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <div>
                <p className="font-semibold">Analysis in Progress</p>
                <p className="text-sm text-muted-foreground">
                  The AI model is processing multi-modal data. This typically
                  takes 30-120 seconds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {prediction.status === "failed" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="font-semibold text-destructive">
                Prediction Failed
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {prediction.errorMessage ||
                  "An error occurred during processing."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results (only if completed) */}
      {prediction.status === "completed" && prediction.results && (
        <>
          {/* TNM Staging */}
          <TNMStageDisplay tnmStaging={prediction.results.tnmStaging} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Survival Curve */}
            {prediction.results.survivalPrediction && (
              <SurvivalChart
                survivalPrediction={prediction.results.survivalPrediction}
              />
            )}

            {/* Feature Importance */}
            {prediction.results.featureImportance && (
              <FeatureImportanceChart
                featureImportance={{
                  pathology: prediction.results.featureImportance.pathology,
                  radiology: prediction.results.featureImportance.radiology,
                  clinical: prediction.results.featureImportance.clinical,
                  // NEW: Combine genomics or show separately
                  genomic:
                    (prediction.results.featureImportance.rnaSeq || 0) +
                    (prediction.results.featureImportance.mutation || 0),
                }}
              />
            )}
          </div>

          {/* Attention Maps (if available) */}
          {prediction.results.attentionMaps && (
            <Card>
              <CardHeader>
                <CardTitle>Attention Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {prediction.results.attentionMaps.pathologyMapUrl && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Pathology Heatmap
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={prediction.results.attentionMaps.pathologyMapUrl}
                          alt="Pathology attention map"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  {prediction.results.attentionMaps.radiologyMapUrl && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Radiology Heatmap
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={prediction.results.attentionMaps.radiologyMapUrl}
                          alt="Radiology attention map"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {prediction.uploadedFiles.pathologyImages &&
              prediction.uploadedFiles.pathologyImages.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Pathology Images (
                    {prediction.uploadedFiles.pathologyImages.length})
                  </p>
                  <ul className="space-y-1 text-sm">
                    {prediction.uploadedFiles.pathologyImages.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        {file.fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {prediction.uploadedFiles.radiologyScans &&
              prediction.uploadedFiles.radiologyScans.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Radiology Scans (
                    {prediction.uploadedFiles.radiologyScans.length})
                  </p>
                  <ul className="space-y-1 text-sm">
                    {prediction.uploadedFiles.radiologyScans.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        {file.fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {prediction.uploadedFiles.clinicalData && (
              <div>
                <p className="text-sm font-medium mb-2">Clinical Data</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {prediction.uploadedFiles.clinicalData.fileName}
                </p>
              </div>
            )}

            {/* NEW: RNA-Seq Data */}
            {prediction.uploadedFiles.rnaSeqData && (
              <div className="border-l-2 border-purple-500 pl-3">
                <p className="text-sm font-medium mb-2 text-purple-600">
                  RNA Sequencing Data
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {prediction.uploadedFiles.rnaSeqData.fileName}
                </p>
              </div>
            )}

            {/* NEW: Mutation Data */}
            {prediction.uploadedFiles.mutationData && (
              <div className="border-l-2 border-orange-500 pl-3">
                <p className="text-sm font-medium mb-2 text-orange-600">
                  Mutation/Variant Data
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {prediction.uploadedFiles.mutationData.fileName}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrediction } from "@/hooks/usePredictions";
import { format } from "date-fns";
import { apiClient } from "@/lib/api/client";

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
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
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
            The prediction you're looking for doesn't exist or failed to load.
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
  const patient = typeof prediction.patient === "object" ? prediction.patient : null;
  const requestedBy = typeof prediction.requestedBy === "object" ? prediction.requestedBy : null;

  // Resolve API Base without the /api suffix to fetch static assets safely
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  // Hero Banner configurations based on decision
  let heroConfig = {
    colorClass: "bg-slate-100 text-slate-800 dark:bg-slate-900 border-slate-200",
    icon: <ShieldAlert className="h-8 w-8" />,
    title: "Unknown State",
    description: "System could not determine an outcome.",
  };

  switch (prediction.decision) {
    case "ACCEPT":
      heroConfig = {
        colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        icon: <CheckCircle2 className="h-8 w-8" />,
        title: "ACCEPT (High Confidence)",
        description: "The intelligent subsystem reached consensus. Diagnosis is confident.",
      };
      break;
    case "DEFER_TO_DOCTOR":
      heroConfig = {
        colorClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        icon: <AlertTriangle className="h-8 w-8" />,
        title: "DEFER TO DOCTOR",
        description: "Model uncertain. Requires meticulous clinical review by a specialist.",
      };
      break;
    case "REJECT_QUALITY":
      heroConfig = {
        colorClass: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        icon: <XCircle className="h-8 w-8" />,
        title: "REJECT (Unusable Quality)",
        description: "The uploaded image lacks adequate macroscopic fidelity or contains extreme blur.",
      };
      break;
    case "REJECT_OOD":
      heroConfig = {
        colorClass: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
        icon: <XCircle className="h-8 w-8" />,
        title: "REJECT (Out Of Distribution)",
        description: "Lesion does not match known dataset clusters or is severely uncharacteristic.",
      };
      break;
  }

  // Derive stable reference URL even for older documents that only have imageFileId
  const getReferenceUrl = () => {
    if (prediction.referenceImageUrl) return `${backendUrl}${prediction.referenceImageUrl}`;
    if (prediction.imageFileId) {
      const filename = String(prediction.imageFileId).replace(/\\/g, '/').split('/').pop();
      return `${backendUrl}/static/uploads/${filename}`;
    }
    return null;
  };
  const refUrl = getReferenceUrl();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Utilities */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Triage Report</h1>
            <p className="text-muted-foreground">
              CDSS Result for {patient?.firstName} {patient?.lastName} • <span className="font-mono">{prediction.predictionId}</span>
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Hero Decision Banner */}
      <Card className={`border-2 ${heroConfig.colorClass}`}>
        <CardContent className="pt-6 pb-6 flex items-center gap-6">
          <div className="flex-shrink-0">
            {heroConfig.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{heroConfig.title}</h2>
            <p className="opacity-90">{heroConfig.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">
                  {patient?.firstName} {patient?.lastName}
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
                <p className="text-muted-foreground">Processed</p>
                <p className="font-medium">
                  {format(new Date(prediction.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Inference Latency</p>
                <p className="font-medium">
                  {prediction.inferenceTimeMs ? (prediction.inferenceTimeMs / 1000).toFixed(2) + "s" : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3 flex-grow">
        {/* Main Prediction Details */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Inference Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Primary Class</span>
                <Badge variant="outline" className="font-mono text-xs font-semibold">{prediction.predictedClass?.toUpperCase() || 'UNKNOWN'}</Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">{prediction.confidence != null ? (prediction.confidence * 100).toFixed(1) : 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Conformal Coverage</span>
                <span className="font-medium">{prediction.coverageGuarantee != null ? (prediction.coverageGuarantee * 100).toFixed(1) : 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Entropy (Uncertainty)</span>
                <span className="font-medium">{prediction.entropy != null ? prediction.entropy.toFixed(3) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">OOD Similarity</span>
                <span className="font-medium">{prediction.oodSimilarity != null ? (prediction.oodSimilarity * 100).toFixed(1) : 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Blur Variance</span>
                <span className="font-medium">{prediction.blurVariance != null ? prediction.blurVariance.toFixed(1) : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saliency & Visuals */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileImage className="h-5 w-5" />
              Grad-CAM Saliency Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2 opacity-80 text-center">Reference Input</p>
                <div className="border border-muted-foreground/30 rounded-lg overflow-hidden bg-black aspect-square flex items-center justify-center relative">
                  {refUrl ? (
                    <img src={refUrl} alt="Original Lesion" className="w-full h-full object-contain bg-black rounded-lg" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Image Unavailable</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 opacity-80 text-center">Class Activation Map (Focus Area)</p>
                {prediction.saliencyMapUrl ? (
                  <div className="border border-primary/20 rounded-lg overflow-hidden bg-black aspect-square relative group">
                    <img
                      src={`${backendUrl}${prediction.saliencyMapUrl}`}
                      alt="Grad-CAM Saliency"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg flex items-center justify-center bg-muted/50 aspect-square">
                    <span className="text-sm text-muted-foreground">Map Unavailable</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

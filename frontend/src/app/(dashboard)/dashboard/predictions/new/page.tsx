"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreatePrediction } from '@/hooks/usePredictions';
import { usePatient } from '@/hooks/usePatients';
import FileUploadZone from '@/components/predictions/FileUploadZone';

export default function NewPredictionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const createPrediction = useCreatePrediction();
  const { data: patientData, isLoading: isPatientLoading } = usePatient(patientId || '');

  // Track the single image
  const [dermoscopyImage, setDermoscopyImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!patientId || !patientData?.data || !dermoscopyImage) return;

    try {
      // Create prediction asynchronously. This is a synchronous backend flow, 
      // resolving when the inference actually completes.
      const result = await createPrediction.mutateAsync({
        patient: patientData.data,
        file: dermoscopyImage
      });
      
      if (result && result._id) {
        // Route smoothly immediately assuming backend resolves populated result.
        router.push(`/dashboard/predictions/${result._id}`);
      }
    } catch (err) {
      // Handled globally by the hook wrapper via Sonner
    }
  };

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Please select a patient first.</p>
        <Button onClick={() => router.push('/dashboard/patients')}>
          Go to Patients List
        </Button>
      </div>
    );
  }

  if (isPatientLoading) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;
  }

  const patient = patientData?.data;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Triage Assessment</h1>
          <p className="text-muted-foreground">
            Generate CDSS analysis for {patient?.firstName} {patient?.lastName}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Dermoscopy Processing Input Zone */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Dermoscopy Image</CardTitle>
            <CardDescription>Upload a single high-resolution macroscopic/dermoscopy lesion image (.jpg, .png, .bmp)</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone 
              label="Lesion Image"
              accept=".jpg,.jpeg,.png,.bmp"
              onFileSelect={(file) => setDermoscopyImage(file)}
            />
          </CardContent>
        </Card>

        {/* Submit Action */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleSubmit}
                disabled={createPrediction.isPending || !dermoscopyImage}
              >
                {createPrediction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Request (CDSS Inference)...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Determine Route (Inference)
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By submitting, image will securely be routed to synchronous inference models.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

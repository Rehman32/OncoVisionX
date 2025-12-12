"use client";

import { useState, use } from 'react';
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

  // State for collected file IDs
  const [files, setFiles] = useState({
    pathologyImages: [] as string[],
    radiologyScans: [] as string[],
    clinicalData: '',
    genomicData: ''
  });

  const handleSubmit = async () => {
    if (!patientId) return;

    try {
      // Transform empty arrays/strings to undefined to match API schema if needed
      // but our schema allows optional, so let's just send what we have
      await createPrediction.mutateAsync({
        patientId,
        files: {
          pathologyImages: files.pathologyImages.length ? files.pathologyImages : undefined,
          radiologyScans: files.radiologyScans.length ? files.radiologyScans : undefined,
          clinicalData: files.clinicalData || undefined,
          genomicData: files.genomicData || undefined
        }
      });
      
      // Redirect to list on success
      router.push('/dashboard/predictions');
    } catch (err) {
      // Handled by hook
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Prediction</h1>
          <p className="text-muted-foreground">
            Upload multi-modal data for {patient?.personalInfo.firstName} {patient?.personalInfo.lastName}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Imaging */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pathology (WSI)</CardTitle>
              <CardDescription>Upload Whole Slide Images (.svs, .tiff, .ndpi)</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone 
                label="Pathology Slides"
                category="pathology"
                accept=".svs,.tiff,.ndpi,.jpg,.jpeg,.png"
                multiple
                onUploadComplete={(ids) => setFiles(prev => ({ ...prev, pathologyImages: [...prev.pathologyImages, ...ids] }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radiology (CT/MRI)</CardTitle>
              <CardDescription>Upload DICOM series or archives (.dcm, .zip)</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone 
                label="Radiology Scans"
                category="radiology"
                accept=".dcm,.zip,.jpg,.png"
                multiple
                onUploadComplete={(ids) => setFiles(prev => ({ ...prev, radiologyScans: [...prev.radiologyScans, ...ids] }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Data */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Data</CardTitle>
              <CardDescription>Upload structured clinical records (.csv, .json)</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone 
                label="Clinical Records"
                category="clinical"
                accept=".csv,.json,.txt"
                onUploadComplete={(ids) => setFiles(prev => ({ ...prev, clinicalData: ids[0] }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genomic Data</CardTitle>
              <CardDescription>Upload sequencing data or biomarker reports</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone 
                label="Genomic Profile"
                category="genomic"
                accept=".csv,.json,.vcf,.txt"
                onUploadComplete={(ids) => setFiles(prev => ({ ...prev, genomicData: ids[0] }))}
              />
            </CardContent>
          </Card>

          {/* Submit Action */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <span>Files selected:</span>
                  <span className="font-semibold">
                    {files.pathologyImages.length + files.radiologyScans.length + (files.clinicalData ? 1 : 0) + (files.genomicData ? 1 : 0)}
                  </span>
                </div>
                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={createPrediction.isPending}
                >
                  {createPrediction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Request...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Generate Prediction
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you confirm that all data is anonymized according to HIPAA/GDPR regulations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

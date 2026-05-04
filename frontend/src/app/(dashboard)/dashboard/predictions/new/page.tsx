"use client";

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Send, ChevronRight, ImageIcon, Stethoscope, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreatePrediction } from '@/hooks/usePredictions';
import { usePatient } from '@/hooks/usePatients';
import FileUploadZone from '@/components/predictions/FileUploadZone';

const HAM10000_SITES = [
  'abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot',
  'genital', 'hand', 'lower extremity', 'neck', 'scalp', 'trunk',
  'unknown', 'upper extremity',
] as const;

export default function NewPredictionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const createPrediction = useCreatePrediction();
  const { data: patientData, isLoading: isPatientLoading } = usePatient(patientId || '');

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Image
  const [dermoscopyImage, setDermoscopyImage] = useState<File | null>(null);

  // Step 2: Metadata overrides
  const [anatomicalSiteOverride, setAnatomicalSiteOverride] = useState<string | null>(null);

  const patient = patientData?.data;

  // Compute age from DOB
  const patientAge = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [patient?.dateOfBirth]);

  // Validation
  const isStep1Valid = !!dermoscopyImage;
  const isStep2Valid = useMemo(() => {
    if (!patient) return false;
    const age = patient.age ?? patientAge;
    const site = anatomicalSiteOverride || patient.anatomicalSite;
    const sex = patient.sex;
    return (
      age !== null && age !== undefined && age >= 0 && age <= 120 &&
      !!site && site !== '' &&
      !!sex
    );
  }, [patient, patientAge, anatomicalSiteOverride]);

  const canSubmit = isStep1Valid && isStep2Valid && !createPrediction.isPending;

  const handleProceedToStep2 = () => {
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!patientId || !patient || !dermoscopyImage) return;

    try {
      const result = await createPrediction.mutateAsync({
        patient,
        file: dermoscopyImage,
        overrides: anatomicalSiteOverride ? { anatomicalSite: anatomicalSiteOverride } : undefined,
      });
      
      if (result && result._id) {
        router.push(`/dashboard/predictions/${result._id}`);
      }
    } catch (err) {
      // Handled by hook
    }
  };

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="p-4 rounded-full bg-muted">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg">Please select a patient first.</p>
        <Button onClick={() => router.push('/dashboard/patients')}>
          Go to Patients List
        </Button>
      </div>
    );
  }

  if (isPatientLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Triage Assessment</h1>
          <p className="text-muted-foreground">
            Late-Fusion CDSS analysis for{' '}
            <span className="font-semibold text-foreground">
              {patient?.firstName} {patient?.lastName}
            </span>
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <StepBadge
          step={1}
          label="Dermoscopy Image"
          icon={ImageIcon}
          isActive={currentStep === 1}
          isComplete={isStep1Valid && currentStep > 1}
        />
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <StepBadge
          step={2}
          label="Clinical Metadata"
          icon={Stethoscope}
          isActive={currentStep === 2}
          isComplete={isStep2Valid && currentStep === 2}
        />
      </div>

      {/* Step 1: Image Upload */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-primary/30 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Dermoscopy Image
              </CardTitle>
              <CardDescription>
                Upload a single high-resolution macroscopic/dermoscopic lesion image. Accepted formats: PNG, JPG, JPEG (max 10MB).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone 
                label="Lesion Image"
                accept=".jpg,.jpeg,.png"
                onFileSelect={(file) => setDermoscopyImage(file)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleProceedToStep2}
              disabled={!isStep1Valid}
              className="gap-2"
            >
              Continue to Metadata Review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Clinical Metadata */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Image summary */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Image attached</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {dermoscopyImage?.name} ({((dermoscopyImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => setCurrentStep(1)}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Review Form */}
          <Card className="border-primary/30 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Clinical Metadata Review
              </CardTitle>
              <CardDescription>
                Review the patient's clinical data used for late-fusion inference. You may override the anatomical site if the current lesion is in a different location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Age — read only */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Patient Age
                  </Label>
                  <Input
                    value={patient?.age ?? patientAge ?? '—'}
                    readOnly
                    disabled
                    className="bg-muted/50 font-semibold"
                  />
                  {(patient?.age ?? patientAge) !== null && ((patient?.age ?? patientAge ?? 0) < 0 || (patient?.age ?? patientAge ?? 0) > 120) && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Age must be between 0 and 120
                    </p>
                  )}
                </div>

                {/* Sex — read only */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sex
                  </Label>
                  <Input
                    value={patient?.sex ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1) : '—'}
                    readOnly
                    disabled
                    className="bg-muted/50 font-semibold capitalize"
                  />
                </div>
              </div>

              <Separator />

              {/* Anatomical Site — overridable */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Anatomical Site
                  <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                    Overridable
                  </Badge>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Default from patient record: <span className="font-semibold capitalize">{patient?.anatomicalSite || 'unknown'}</span>. 
                  Change below if the current lesion is on a different body part.
                </p>
                <Select
                  value={anatomicalSiteOverride || patient?.anatomicalSite || 'unknown'}
                  onValueChange={(value) => setAnatomicalSiteOverride(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select anatomical site" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAM10000_SITES.map((site) => (
                      <SelectItem key={site} value={site}>
                        {site.charAt(0).toUpperCase() + site.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Reference */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Patient Reference
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>{' '}
                    <span className="font-mono font-semibold">{patient?.patientId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-semibold">{patient?.firstName} {patient?.lastName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/30">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <Button 
                  size="lg" 
                  className="w-full gap-2 shadow-lg shadow-primary/25" 
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {createPrediction.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing CDSS Inference...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit for Triage
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  The image and metadata will be securely routed to the late-fusion inference pipeline.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Step 1 */}
          <div className="flex justify-start">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Image Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step Badge Component ---
function StepBadge({
  step,
  label,
  icon: Icon,
  isActive,
  isComplete,
}: {
  step: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-primary/10 border border-primary/20 text-primary shadow-sm'
        : isComplete
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-muted/50 border border-transparent text-muted-foreground'
    }`}>
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        isComplete
          ? 'bg-emerald-600 text-white'
          : isActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

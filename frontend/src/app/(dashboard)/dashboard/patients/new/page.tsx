"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientForm from '@/components/patients/PatientForm';
import { useCreatePatient } from '@/hooks/usePatients';
import { PatientFormData } from '@/lib/validations/patient';

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();

  const handleSubmit = async (data: PatientFormData) => {
    try {
      await createPatient.mutateAsync(data as any);
      router.push('/dashboard/patients');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Patient</h1>
          <p className="text-muted-foreground">
            Add a new patient to the system
          </p>
        </div>
      </div>

      <PatientForm
        onSubmit={handleSubmit}
        isLoading={createPatient.isPending}
      />
    </div>
  );
}

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PatientForm from '@/components/patients/PatientForm';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { PatientFormData } from '@/lib/validations/patient';

export default function EditPatientPage({ params }: { params: Promise<{id : string}> }) {
  const {id}= React.use(params)
  const router = useRouter();
  const { data, isLoading } = usePatient(id);
  const updatePatient = useUpdatePatient(id);

  const handleSubmit = async (formData: PatientFormData) => {
    try {
      await updatePatient.mutateAsync(formData as any);
      router.push(`/dashboard/patients/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Patient not found</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Patient</h1>
          <p className="text-muted-foreground">
            Update patient information for {data.data.personalInfo.firstName} {data.data.personalInfo.lastName}
          </p>
        </div>
      </div>

      <PatientForm
        defaultValues={data.data}
        onSubmit={handleSubmit}
        isLoading={updatePatient.isPending}
      />
    </div>
  );
}

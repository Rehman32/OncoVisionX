"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientForm from '@/components/patients/PatientForm';
import { useCreatePatient } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useDoctors';
import { PatientFormData } from '@/lib/validations/patient';
import { useAuthStore } from '@/store/authStore';

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();
  const { user } = useAuthStore();

  const handleSubmit = async (data: PatientFormData) => {
    // If user is a doctor and no assignedDoctor selected, auto-assign self
    const payload = {
      ...data,
      assignedDoctor: data.assignedDoctor || (user?.role === 'doctor' ? user._id : undefined),
    };

    try {
      await createPatient.mutateAsync(payload as any);
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

      {doctorsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <PatientForm
          onSubmit={handleSubmit}
          isLoading={createPatient.isPending}
          doctors={doctorsData?.data || []}
        />
      )}
    </div>
  );
}

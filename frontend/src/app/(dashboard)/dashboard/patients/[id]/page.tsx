"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, FileText, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatient } from '@/hooks/usePatients';
import { format } from 'date-fns';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, isLoading, isError } = usePatient(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Patient not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The patient you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/patients')}>
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const patient = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {patient.personalInfo.firstName} {patient.personalInfo.lastName}
              </h1>
              <Badge variant="outline" className="font-mono">
                {patient.patientId}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {patient.age} years old • {patient.personalInfo.gender} • Added {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/predictions/new?patientId=${patient._id}`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            New Prediction
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/patients/${patient._id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-base">
                  {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p className="text-base">
                  {format(new Date(patient.personalInfo.dateOfBirth), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-base capitalize">{patient.personalInfo.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                <p className="text-base">{patient.personalInfo.bloodType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                <p className="text-base">{patient.personalInfo.contactNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{patient.personalInfo.email || 'Not provided'}</p>
              </div>
            </div>

            {patient.personalInfo.address && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Address</p>
                  <p className="text-base">
                    {[
                      patient.personalInfo.address.street,
                      patient.personalInfo.address.city,
                      patient.personalInfo.address.state,
                      patient.personalInfo.address.zipCode,
                      patient.personalInfo.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Not provided'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="text-2xl font-bold">{patient.age} years</p>
            </div>
            {patient.bmi && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">BMI</p>
                <p className="text-2xl font-bold">{patient.bmi}</p>
              </div>
            )}
            {patient.medicalInfo?.smokingStatus && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Smoking Status</p>
                <Badge
                  variant={
                    patient.medicalInfo.smokingStatus === 'current'
                      ? 'destructive'
                      : patient.medicalInfo.smokingStatus === 'former'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="mt-1"
                >
                  {patient.medicalInfo.smokingStatus}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Height</p>
              <p className="text-base">
                {patient.medicalInfo?.height ? `${patient.medicalInfo.height} cm` : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p className="text-base">
                {patient.medicalInfo?.weight ? `${patient.medicalInfo.weight} kg` : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pack Years</p>
              <p className="text-base">
                {patient.medicalInfo?.smokingPackYears || 'N/A'}
              </p>
            </div>
          </div>

          {patient.medicalInfo?.comorbidities && patient.medicalInfo.comorbidities.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Comorbidities</p>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalInfo.comorbidities.map((condition, i) => (
                    <Badge key={i} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {patient.medicalInfo?.allergies && patient.medicalInfo.allergies.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalInfo.allergies.map((allergy, i) => (
                    <Badge key={i} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {patient.medicalInfo?.currentMedications && patient.medicalInfo.currentMedications.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Medications</p>
                <ul className="list-disc list-inside space-y-1">
                  {patient.medicalInfo.currentMedications.map((med, i) => (
                    <li key={i} className="text-sm">
                      {med}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      {patient.emergencyContact && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base">{patient.emergencyContact.name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                <p className="text-base">{patient.emergencyContact.relationship || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="text-base">{patient.emergencyContact.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

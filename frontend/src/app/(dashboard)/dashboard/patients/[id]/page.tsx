"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/hooks/usePatients";
import { format } from "date-fns";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/patients")}
          >
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  const patient = data.data;
  const doctor =
    typeof patient.assignedDoctor === "object" ? patient.assignedDoctor : null;

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
                {patient.firstName || ''} {patient.lastName || ''}
              </h1>
              <Badge variant="outline" className="font-mono">
                {patient.patientId}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {patient.age ?? 'N/A'} years old • {patient.sex || 'unknown'} • Added{" "}
              {patient.createdAt ? format(new Date(patient.createdAt), "MMM dd, yyyy") : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/predictions/new?patientId=${patient._id}`)
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            New Prediction
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/patients/${patient._id}/edit`)
            }
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
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Full Name
                </p>
                <p className="text-base">
                  {patient.firstName || ''}{" "}
                  {patient.lastName || ''}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </p>
                <p className="text-base">
                  {patient.dateOfBirth
                    ? format(new Date(patient.dateOfBirth), "MMMM dd, yyyy")
                    : "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sex
                </p>
                <p className="text-base capitalize">
                  {patient.sex || 'unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Anatomical Site
                </p>
                <Badge variant="outline" className="capitalize mt-1">
                  {patient.anatomicalSite || 'unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Contact Number
                </p>
                <p className="text-base">
                  {patient.contactNumber || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-base">
                  {patient.email || "Not provided"}
                </p>
              </div>
            </div>

            {patient.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Clinical Notes
                  </p>
                  <p className="text-base text-sm">
                    {patient.notes}
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
              <p className="text-2xl font-bold">{patient.age ?? 'N/A'} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Sex
              </p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {patient.sex || 'unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Lesion Site
              </p>
              <Badge variant="outline" className="mt-1 capitalize">
                {patient.anatomicalSite || 'unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Doctor */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Doctor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Consultant
            </p>
            <p className="text-base">
              {doctor
                ? `Dr ${doctor.firstName} ${doctor.lastName}`
                : "Not assigned"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

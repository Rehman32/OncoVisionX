"use client";

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Eye, Edit, FileText, Trash } from 'lucide-react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';

interface PatientTableProps {
  data: Patient[];
  isLoading: boolean;
  isError: boolean;
  pagination: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export default function PatientTable({
  data,
  isLoading,
  isError,
  pagination,
}: PatientTableProps) {
  const router = useRouter();

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-sm text-destructive">
          Failed to load patients. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You haven't added any patients yet. Get started by creating a new patient record.
          </p>
          <Button onClick={() => router.push('/dashboard/patients/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Age/Gender</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Smoking Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((patient) => (
              <TableRow
                key={patient._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dashboard/patients/${patient._id}`)}
              >
                <TableCell className="font-mono text-sm">
                  {patient.patientId}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                    </p>
                    {patient.personalInfo.email && (
                      <p className="text-sm text-muted-foreground">
                        {patient.personalInfo.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{patient.age || 'N/A'} years</p>
                    <p className="text-muted-foreground capitalize">
                      {patient.personalInfo.gender}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {patient.personalInfo.contactNumber || 'N/A'}
                </TableCell>
                <TableCell>
                  {patient.medicalInfo?.smokingStatus ? (
                    <Badge
                      variant={
                        patient.medicalInfo.smokingStatus === 'current'
                          ? 'destructive'
                          : patient.medicalInfo.smokingStatus === 'former'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {patient.medicalInfo.smokingStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/patients/${patient._id}`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/patients/${patient._id}/edit`);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/predictions/new?patientId=${patient._id}`);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        New Prediction
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Add confirmation dialog
                          console.log('Delete', patient._id);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing import
import { Plus } from 'lucide-react';

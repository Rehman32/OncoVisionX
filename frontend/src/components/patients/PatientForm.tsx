"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { patientFormSchema, PatientFormData, HAM10000_SITES } from '@/lib/validations/patient';
import { Loader2 } from 'lucide-react';

interface PatientFormProps {
  defaultValues?: Partial<PatientFormData>;
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
}

export default function PatientForm({ defaultValues, onSubmit, isLoading }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: defaultValues || {
      sex: 'unknown',
      anatomicalSite: 'unknown',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
                disabled={isLoading}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              <Select
                defaultValue={watch('sex')}
                onValueChange={(value) => setValue('sex', value as PatientFormData["sex"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {errors.sex && (
                <p className="text-sm text-destructive">
                  {errors.sex.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="anatomicalSite">Anatomical Site *</Label>
              <Select
                defaultValue={watch('anatomicalSite')}
                onValueChange={(value) => setValue('anatomicalSite', value as PatientFormData["anatomicalSite"])}
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
              {errors.anatomicalSite && (
                <p className="text-sm text-destructive">
                  {errors.anatomicalSite.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="+1234567890"
                {...register('contactNumber')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes or previous history..."
              {...register('notes')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? 'Update Patient' : 'Create Patient'}
        </Button>
      </div>
    </form>
  );
}

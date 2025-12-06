"use client";

import { useForm, useFieldArray } from 'react-hook-form';
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
import { patientFormSchema, PatientFormData } from '@/lib/validations/patient';
import { Patient } from '@/types/patient';
import { Loader2, Plus, X } from 'lucide-react';

interface PatientFormProps {
  defaultValues?: Partial<Patient>;
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
}

export default function PatientForm({ defaultValues, onSubmit, isLoading }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: defaultValues ? {
      personalInfo: defaultValues.personalInfo,
      medicalInfo: defaultValues.medicalInfo,
      emergencyContact: defaultValues.emergencyContact,
    } : {
      personalInfo: {
        gender: 'male',
      },
    },
  });

  // Field arrays for dynamic lists
  const { fields: comorbiditiesFields, append: appendComorbidity, remove: removeComorbidity } = 
    useFieldArray({ control, name: 'medicalInfo.comorbidities' });
  
  const { fields: allergiesFields, append: appendAllergy, remove: removeAllergy } = 
    useFieldArray({ control, name: 'medicalInfo.allergies' });
  
  const { fields: medicationsFields, append: appendMedication, remove: removeMedication } = 
    useFieldArray({ control, name: 'medicalInfo.currentMedications' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('personalInfo.firstName')}
                disabled={isLoading}
              />
              {errors.personalInfo?.firstName && (
                <p className="text-sm text-destructive">
                  {errors.personalInfo.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('personalInfo.lastName')}
                disabled={isLoading}
              />
              {errors.personalInfo?.lastName && (
                <p className="text-sm text-destructive">
                  {errors.personalInfo.lastName.message}
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
                {...register('personalInfo.dateOfBirth')}
                disabled={isLoading}
              />
              {errors.personalInfo?.dateOfBirth && (
                <p className="text-sm text-destructive">
                  {errors.personalInfo.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                defaultValue={watch('personalInfo.gender')}
                onValueChange={(value) => setValue('personalInfo.gender', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select
                defaultValue={watch('personalInfo.bloodType')}
                onValueChange={(value) => setValue('personalInfo.bloodType', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="+1234567890"
                {...register('personalInfo.contactNumber')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                {...register('personalInfo.email')}
                disabled={isLoading}
              />
              {errors.personalInfo?.email && (
                <p className="text-sm text-destructive">
                  {errors.personalInfo.email.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Address (Optional)</h4>
            <div className="grid gap-4">
              <Input
                placeholder="Street Address"
                {...register('personalInfo.address.street')}
                disabled={isLoading}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="City"
                  {...register('personalInfo.address.city')}
                  disabled={isLoading}
                />
                <Input
                  placeholder="State/Province"
                  {...register('personalInfo.address.state')}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="ZIP/Postal Code"
                  {...register('personalInfo.address.zipCode')}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Country"
                  {...register('personalInfo.address.country')}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="175"
                {...register('medicalInfo.height', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                {...register('medicalInfo.weight', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceStatus">ECOG Performance Status</Label>
              <Select
                defaultValue={watch('medicalInfo.performanceStatus')?.toString()}
                onValueChange={(value) => setValue('medicalInfo.performanceStatus', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((status) => (
                    <SelectItem key={status} value={status.toString()}>
                      {status} - {['Fully active', 'Restricted', 'Ambulatory', 'Limited', 'Disabled', 'Dead'][status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Smoking History (Critical for NSCLC)</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smokingStatus">Smoking Status</Label>
                <Select
                  defaultValue={watch('medicalInfo.smokingStatus')}
                  onValueChange={(value) => setValue('medicalInfo.smokingStatus', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former Smoker</SelectItem>
                    <SelectItem value="current">Current Smoker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smokingPackYears">Pack Years</Label>
                <Input
                  id="smokingPackYears"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  {...register('medicalInfo.smokingPackYears', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Pack years = (packs per day) × (years smoked)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comorbidities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Comorbidities</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendComorbidity('')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {comorbiditiesFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="e.g., Hypertension, Diabetes"
                  {...register(`medicalInfo.comorbidities.${index}` as const)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeComorbidity(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Allergies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Allergies</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAllergy('')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {allergiesFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="e.g., Penicillin, Latex"
                  {...register(`medicalInfo.allergies.${index}` as const)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAllergy(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Current Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Current Medications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendMedication('')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {medicationsFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="e.g., Aspirin 81mg daily"
                  {...register(`medicalInfo.currentMedications.${index}` as const)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedication(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Name</Label>
              <Input
                id="emergencyName"
                placeholder="John Doe"
                {...register('emergencyContact.name')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyRelationship">Relationship</Label>
              <Input
                id="emergencyRelationship"
                placeholder="Spouse, Parent, etc."
                {...register('emergencyContact.relationship')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Phone Number</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                placeholder="+1234567890"
                {...register('emergencyContact.phoneNumber')}
                disabled={isLoading}
              />
            </div>
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

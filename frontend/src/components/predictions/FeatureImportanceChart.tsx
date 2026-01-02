import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Microscope, Activity, FileText, Dna } from 'lucide-react';

interface FeatureImportanceChartProps {
  featureImportance: {
    pathology: number;
    radiology: number;
    clinical: number;
    genomic: number;
  };
}

export default function FeatureImportanceChart({ featureImportance }: FeatureImportanceChartProps) {
  const features = [
    {
      name: 'Pathology (WSI)',
      value: featureImportance.pathology,
      icon: Microscope,
      color: 'bg-blue-500',
    },
    {
      name: 'Radiology (CT/MRI)',
      value: featureImportance.radiology,
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      name: 'Clinical Data',
      value: featureImportance.clinical,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Genomic Data',
      value: featureImportance.genomic,
      icon: Dna,
      color: 'bg-amber-500',
    },
  ].sort((a, b) => b.value - a.value); // Sort by importance

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Modal Feature Importance</CardTitle>
        <CardDescription>
          Contribution of each data modality to the final prediction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const percentage = Math.round(feature.value * 100);
          
          return (
            <div key={feature.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${feature.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{feature.name}</span>
                </div>
                <span className="text-sm font-bold">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
          <p className="font-semibold mb-1">Interpretation:</p>
          <p className="text-muted-foreground">
            The model weighted <strong>{features[0].name}</strong> most heavily ({Math.round(features[0].value * 100)}%) 
            in determining this prediction. This suggests {features[0].name.toLowerCase()} features were most 
            discriminative for staging classification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

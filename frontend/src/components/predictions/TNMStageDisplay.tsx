import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TNMStageDisplayProps {
  tnmStaging: {
    tStage: string;
    nStage: string;
    mStage: string;
    overallStage: string;
    confidence: number;
  };
}

export default function TNMStageDisplay({ tnmStaging }: TNMStageDisplayProps) {
  const confidencePercent = Math.round(tnmStaging.confidence * 100);
  
  // Color based on confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.75) return 'text-amber-600';
    return 'text-red-600';
  };

  // Stage severity indicator
  const getStageSeverity = (stage: string) => {
    const stageNum = stage.match(/(\d+)/)?.[0];
    if (!stageNum) return 'default';
    const num = parseInt(stageNum);
    if (num <= 1) return 'outline';
    if (num === 2) return 'secondary';
    if (num === 3) return 'destructive';
    return 'destructive';
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center justify-between">
          <span>TNM Staging Classification</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  TNM system classifies cancer: T (Tumor size), N (Lymph Nodes), M (Metastasis).
                  Overall stage combines these into clinical staging (0-IV).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Overall Stage - Hero Display */}
        <div className="text-center mb-6 p-6 bg-primary/5 rounded-lg border">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Overall Stage
          </p>
          <div className="text-6xl font-bold text-primary mb-2">
            {tnmStaging.overallStage}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <span className={`text-lg font-semibold ${getConfidenceColor(tnmStaging.confidence)}`}>
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-2 mt-3" />
        </div>

        {/* Individual TNM Components */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg bg-card">
            <Badge variant={getStageSeverity(tnmStaging.tStage)} className="mb-2">
              T Stage
            </Badge>
            <div className="text-3xl font-bold">{tnmStaging.tStage}</div>
            <p className="text-xs text-muted-foreground mt-1">Tumor Size</p>
          </div>

          <div className="text-center p-4 border rounded-lg bg-card">
            <Badge variant={getStageSeverity(tnmStaging.nStage)} className="mb-2">
              N Stage
            </Badge>
            <div className="text-3xl font-bold">{tnmStaging.nStage}</div>
            <p className="text-xs text-muted-foreground mt-1">Lymph Nodes</p>
          </div>

          <div className="text-center p-4 border rounded-lg bg-card">
            <Badge variant={getStageSeverity(tnmStaging.mStage)} className="mb-2">
              M Stage
            </Badge>
            <div className="text-3xl font-bold">{tnmStaging.mStage}</div>
            <p className="text-xs text-muted-foreground mt-1">Metastasis</p>
          </div>
        </div>

        {/* Clinical Interpretation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
          <p className="font-semibold mb-1">Clinical Interpretation:</p>
          <p className="text-muted-foreground">
            {getStageDescription(tnmStaging.overallStage)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper: Stage descriptions for clinicians
function getStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    'IA1': 'Tumor ≤1cm, no spread. Excellent prognosis. Surgical resection recommended.',
    'IA2': 'Tumor 1-2cm, no spread. Very good prognosis. Surgery is curative in most cases.',
    'IB': 'Tumor 2-3cm or invasion of pleura. Good prognosis with surgical intervention.',
    'IIA': 'Tumor 3-4cm or limited spread. Multimodal therapy may be indicated.',
    'IIB': 'Tumor 4-5cm or chest wall invasion. Combined surgery and adjuvant therapy recommended.',
    'IIIA': 'Locally advanced with node involvement. Neoadjuvant therapy before surgery.',
    'IIIB': 'Extensive local invasion. Concurrent chemoradiotherapy typically indicated.',
    'IIIC': 'Multiple positive nodes. Aggressive multimodal treatment required.',
    'IVA': 'Single distant metastasis. Palliative systemic therapy with possible local control.',
    'IVB': 'Multiple distant metastases. Palliative care and systemic therapy focus.',
  };
  return descriptions[stage] || 'Please consult oncology guidelines for treatment planning.';
}

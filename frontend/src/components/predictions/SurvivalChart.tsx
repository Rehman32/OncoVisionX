"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SurvivalChartProps {
  survivalPrediction: {
    oneYearSurvival: number;
    threeYearSurvival: number;
    fiveYearSurvival: number;
  };
}

export default function SurvivalChart({ survivalPrediction }: SurvivalChartProps) {
  const data = [
    {
      year: 0,
      probability: 100,
    },
    {
      year: 1,
      probability: survivalPrediction.oneYearSurvival * 100,
    },
    {
      year: 3,
      probability: survivalPrediction.threeYearSurvival * 100,
    },
    {
      year: 5,
      probability: survivalPrediction.fiveYearSurvival * 100,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Survival Probability Curve</CardTitle>
        <CardDescription>
          Estimated survival rates based on multi-modal analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Survival Probability (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="probability" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              name="Survival Rate"
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {(survivalPrediction.oneYearSurvival * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">1-Year Survival</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {(survivalPrediction.threeYearSurvival * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">3-Year Survival</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {(survivalPrediction.fiveYearSurvival * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">5-Year Survival</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

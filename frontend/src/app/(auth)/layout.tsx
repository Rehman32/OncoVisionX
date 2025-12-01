import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            <Link href="/" className="mx-auto flex items-center space-x-2 text-primary mb-8">
              <Activity className="h-8 w-8" />
              <span className="font-bold text-2xl tracking-tight">CancerVision360</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
      
      {/* Right Side - Hero Image/Info */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
        
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Advanced AI for Non-Small Cell Lung Cancer Staging
          </h1>
          <p className="text-lg text-slate-300">
            A multi-modal deep learning system integrating pathology, radiology, clinical, and genomic data for precise prognosis prediction.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-primary mb-1">Multi-Modal</h3>
              <p className="text-sm text-slate-400">Pathology + Radiology + Clinical + Genomic</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-primary mb-1">TNM Staging</h3>
              <p className="text-sm text-slate-400">Precise automated classification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

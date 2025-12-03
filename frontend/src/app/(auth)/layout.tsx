import Link from 'next/link';
import { Activity, Shield, Zap, Brain, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-to-br from-background via-background to-slate-50/50 dark:to-slate-950/50 relative">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex flex-col space-y-2 text-center">
            <Link
              href="/"
              className={cn(
                "mx-auto flex items-center space-x-2 text-primary mb-8 group",
                "hover:opacity-80 transition-all duration-300"
              )}
            >
              <div className="relative">
                <Activity className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-300"></div>
              </div>
              <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                OncoVisionX
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/10"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl mx-auto space-y-8">
          {/* Main heading with gradient */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">HIPAA Compliant & Secure</span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                Advanced AI for
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-400">
                Non-Small Cell Lung Cancer Staging
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed">
              Harness the power of multi-modal deep learning for precise TNM staging and prognosis prediction.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="group p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-semibold text-white">Multi-Modal AI</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Integrates pathology, radiology, clinical, and genomic data
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-semibold text-white">TNM Staging</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automated and accurate classification system
              </p>
            </div>

            <div className="group p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-semibold text-white">Prognosis Prediction</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Data-driven insights for personalized treatment planning and patient outcomes
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <div>
              <div className="text-2xl font-bold text-white">98.5%</div>
              <div className="text-xs text-slate-500">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-xs text-slate-500">Cases Analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">200+</div>
              <div className="text-xs text-slate-500">Institutions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
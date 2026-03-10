interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  labels?: string[];
}

export function StepIndicator({ totalSteps, currentStep, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : isCompleted
                      ? 'bg-cyan-600/30 text-cyan-400'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step}
              </div>
              {labels?.[i] && (
                <span
                  className={`text-[10px] ${
                    isActive
                      ? 'text-cyan-400'
                      : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-600'
                  }`}
                >
                  {labels[i]}
                </span>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`w-8 h-0.5 ${
                  isCompleted ? 'bg-cyan-600/50' : 'bg-slate-800'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

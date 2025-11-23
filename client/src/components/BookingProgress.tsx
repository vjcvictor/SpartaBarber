import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
}

const steps: Step[] = [
  { number: 1, label: 'Servicio' },
  { number: 2, label: 'Fecha y hora' },
  { number: 3, label: 'Datos' },
  { number: 4, label: 'Confirmación' },
];

interface BookingProgressProps {
  currentStep: number;
}

export default function BookingProgress({ currentStep }: BookingProgressProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-colors",
                  currentStep > step.number - 1 ? "bg-primary" : "bg-border"
                )} />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 flex-shrink-0",
                currentStep > step.number
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep === step.number
                    ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-background border-border text-muted-foreground"
              )}>
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-colors",
                  currentStep > step.number ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
            <span className={cn(
              "text-xs md:text-sm font-medium mt-2 text-center",
              currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

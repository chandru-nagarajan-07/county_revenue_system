import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'input', label: 'Input' },
  { key: 'validation', label: 'Validate' },
  { key: 'review', label: 'Review' },
  { key: 'processing', label: 'Process' },
  { key: 'verification', label: 'Verify' },
  { key: 'authorization', label: 'Approve' },
];

function WorkflowStepper({ currentStage }) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);
  
  // If we're past authorization (cross-sell, feedback, complete), show all as done
  const effectiveIndex = currentIndex === -1 ? STAGES.length : currentIndex;

  return (
    <div className="flex items-center gap-1 w-full px-2">
      {STAGES.map((stage, i) => {
        const isDone = i < effectiveIndex;
        const isCurrent = i === effectiveIndex;

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isDone && "bg-success text-success-foreground",
                  isCurrent && "gold-gradient text-accent-foreground shadow-gold",
                  !isDone && !isCurrent && "bg-secondary text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
              </div>
              <span className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 mt-[-18px] rounded-full transition-colors",
                i < effectiveIndex ? "bg-success" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WorkflowStepper;

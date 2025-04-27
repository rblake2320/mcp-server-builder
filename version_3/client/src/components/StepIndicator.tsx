import { Step } from "@/types";

interface StepIndicatorProps {
  steps: Step[];
}

const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center relative">
            <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center 
              ${step.status === 'completed' || step.status === 'current' 
                ? 'bg-primary text-white' 
                : 'bg-neutral-200 text-neutral-600'}`}
            >
              {step.status === 'completed' ? (
                <i className="fas fa-check text-sm"></i>
              ) : (
                <span className="text-sm">{step.id}</span>
              )}
            </div>
            <div className={`absolute top-0 -ml-10 text-center mt-12 w-32 text-sm font-medium 
              ${step.status === 'completed' || step.status === 'current' 
                ? 'text-primary' 
                : 'text-neutral-500'}`}
            >
              {step.name}
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out 
                ${step.status === 'completed' ? 'border-primary' : 'border-neutral-300'}`}
                style={{ width: '100%', minWidth: '5rem' }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;

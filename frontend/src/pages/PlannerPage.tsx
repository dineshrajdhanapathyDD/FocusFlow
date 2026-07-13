import { useState } from 'react';
import { DailyPlanner } from '@/components/planner';
import { mockDailyPlan } from '@/services/mockData';
import type { DailyPlan } from '@/types';
import toast from 'react-hot-toast';

export default function PlannerPage() {
  const [plan, setPlan] = useState<DailyPlan | undefined>(mockDailyPlan);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setLoading(true);
    // Simulated AI plan generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPlan(mockDailyPlan);
    setLoading(false);
    toast.success('AI generated your daily plan!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <DailyPlanner plan={plan} onGeneratePlan={handleGeneratePlan} loading={loading} />
    </div>
  );
}

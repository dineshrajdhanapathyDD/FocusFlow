import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'focusflow_onboarding_complete';

export function useOnboarding() {
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setCompleted(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
  }, []);

  return { completed, complete, reset };
}

'use client';

import { useUserActivity } from '@/hooks/useUserActivity';

interface UserActivityTrackerProps {
  children: React.ReactNode;
}

export function UserActivityTracker({ children }: UserActivityTrackerProps) {
  useUserActivity();
  
  return <>{children}</>;
}

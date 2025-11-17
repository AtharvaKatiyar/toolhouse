'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EscrowDepositPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflow');
  const [countdown, setCountdown] = useState(2);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (hasRedirected) return;

    // Wait a bit to ensure wallet connection is stable
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setHasRedirected(true);
          // Redirect to dashboard gas escrow tab after state update
          setTimeout(() => {
            if (workflowId) {
              router.push(`/dashboard/escrow?workflow=${workflowId}`);
            } else {
              router.push('/dashboard/escrow');
            }
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [workflowId, router, hasRedirected]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Redirecting to gas deposit{countdown > 0 && ` in ${countdown}...`}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Preparing wallet connection...
        </p>
      </div>
    </div>
  );
}

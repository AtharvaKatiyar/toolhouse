import { Badge } from '@/components/ui/badge';

interface WorkflowStatusBadgeProps {
  status: 'active' | 'paused' | 'failed';
  className?: string;
}

export function WorkflowStatusBadge({ status, className = '' }: WorkflowStatusBadgeProps) {
  const variants = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const labels = {
    active: 'Active',
    paused: 'Paused',
    failed: 'Failed',
  };

  return (
    <Badge className={`${variants[status]} ${className}`}>
      {labels[status]}
    </Badge>
  );
}

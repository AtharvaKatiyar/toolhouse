'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TriggerIcon } from './trigger-icon';
import { ActionIcon } from './action-icon';
import { WorkflowStatusBadge } from './workflow-status-badge';
import { ArrowRight, Calendar, Clock, PlayCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface WorkflowSummaryCardProps {
  id: number;
  name: string;
  triggerType: 'time' | 'price' | 'wallet';
  actionType: 'native' | 'erc20' | 'contract';
  status: 'active' | 'paused' | 'failed';
  nextRun?: string;
  lastExecuted?: string;
  createdAt?: string;
  executionCount?: number;
}

export function WorkflowSummaryCard({
  id,
  name,
  triggerType,
  actionType,
  status,
  nextRun,
  lastExecuted,
  createdAt,
  executionCount = 0,
}: WorkflowSummaryCardProps) {
  const hasNeverExecuted = executionCount === 0 && status === 'active';
  
  return (
    <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">{name || `Workflow #${id}`}</h3>
            <WorkflowStatusBadge status={status} />
            {hasNeverExecuted && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending First Execution
              </Badge>
            )}
            {executionCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <PlayCircle className="h-3 w-3 mr-1" />
                {executionCount} execution{executionCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TriggerIcon type={triggerType} />
              <span className="text-sm text-muted-foreground capitalize">
                {triggerType} trigger
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <ActionIcon type={actionType} />
              <span className="text-sm text-muted-foreground capitalize">
                {actionType} action
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(createdAt).toLocaleString()}</span>
              </div>
            )}
            
            {nextRun && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Next run: {new Date(nextRun).toLocaleString()}</span>
              </div>
            )}

            {lastExecuted && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <PlayCircle className="h-4 w-4" />
                <span>Last executed: {new Date(lastExecuted).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <Link href={`/dashboard/workflows/${id}`}>
          <Button variant="ghost" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}

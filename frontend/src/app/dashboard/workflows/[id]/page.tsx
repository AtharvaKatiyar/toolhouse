'use client';

import { useEffect, useState, use } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowStatusBadge } from '@/components/dashboard/workflow-status-badge';
import { TriggerDetails } from '@/components/dashboard/trigger-details';
import { ActionDetails } from '@/components/dashboard/action-details';
import { EscrowStatsCard } from '@/components/dashboard/escrow-stats-card';
import { ExecutionHistoryTable } from '@/components/dashboard/execution-history-table';
import { ArrowLeft, Pause, Play, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WorkflowData {
  id: number;
  user: string;
  triggerType: 'time' | 'price' | 'wallet';
  actionType: 'native' | 'erc20' | 'contract';
  status: 'active' | 'paused' | 'failed';
  nextRun?: string;
  gasBudget: string;
  maxGasPrice: string;
  triggerData: any;
  actionData: any;
  createdAt: string;
  executionCount?: number;
}

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const workflowId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [gasBalance, setGasBalance] = useState('0');
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchWorkflowDetails();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, workflowId]);

  const fetchWorkflowDetails = async () => {
    try {
      setLoading(true);

      // Fetch workflow details
      const workflowRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${workflowId}`
      );
      
      // Extract workflow from response object
      const rawWorkflow = workflowRes.data?.workflow || workflowRes.data;
      
      // Transform backend field names (snake_case) to frontend (camelCase)
      const transformedWorkflow = {
        id: rawWorkflow.id,
        user: rawWorkflow.owner || rawWorkflow.user,
        triggerType: mapTriggerType(rawWorkflow.trigger_type),
        actionType: mapActionType(rawWorkflow.action_type),
        status: rawWorkflow.active ? 'active' : 'paused',
        nextRun: rawWorkflow.next_run ? rawWorkflow.next_run * 1000 : undefined, // Convert Unix timestamp to ms
        gasBudget: `${rawWorkflow.gas_budget_eth || '0'} DEV`,
        maxGasPrice: 'Auto', // Not available from contract
        triggerData: rawWorkflow.trigger_data,
        actionData: rawWorkflow.action_data,
        createdAt: new Date().toISOString(), // Not available from contract
        executionCount: 0, // Not available from contract
      };
      
      setWorkflow(transformedWorkflow as WorkflowData);

      // Fetch gas balance
      try {
        const balanceRes = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/escrow/balance/${address}`
        );
        setGasBalance(balanceRes.data.balance || '0');
      } catch (err) {
        console.error('Error fetching balance:', err);
      }

      // Fetch execution history
      try {
        const executionsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/executions/${workflowId}`
        );
        const executionsData = Array.isArray(executionsRes.data)
          ? executionsRes.data
          : executionsRes.data?.executions || [];
        setExecutions(executionsData);
      } catch (err) {
        console.error('Error fetching executions:', err);
        setExecutions([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions to map backend types to frontend types
  const mapTriggerType = (type: number): 'time' | 'price' | 'wallet' => {
    switch (type) {
      case 1: return 'time';
      case 2: return 'price';
      case 3: return 'wallet';
      default: return 'time';
    }
  };
  
  const mapActionType = (type: number): 'native' | 'erc20' | 'contract' => {
    switch (type) {
      case 1: return 'native';
      case 2: return 'erc20';
      case 3: return 'contract';
      default: return 'native';
    }
  };

  const handleTogglePause = async () => {
    if (!workflow) return;
    
    try {
      setActionLoading(true);
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${workflowId}/status`,
        { status: newStatus }
      );

      setWorkflow({ ...workflow, status: newStatus as any });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to update workflow status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${workflowId}`);
      router.push('/dashboard/workflows');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
      setActionLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view workflow details
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-6">
          <Card className="h-32 animate-pulse bg-muted" />
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-64 animate-pulse bg-muted" />
            <Card className="h-64 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Workflow Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            This workflow doesn't exist or you don't have access to it
          </p>
          <Link href="/dashboard/workflows">
            <Button className="mt-6">Back to Workflows</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/workflows">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">Workflow #{workflow.id}</h1>
              <WorkflowStatusBadge status={workflow.status} />
            </div>
            <p className="mt-2 text-muted-foreground">
              Created {new Date(workflow.createdAt).toLocaleDateString()}
            </p>
            {workflow.executionCount !== undefined && (
              <p className="text-sm text-muted-foreground">
                Executed {workflow.executionCount} times
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTogglePause}
              disabled={actionLoading}
            >
              {workflow.status === 'active' ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading}
              className="border-red-500/20 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Summary */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-semibold">Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Trigger Type</p>
            <p className="mt-1 font-medium capitalize">{workflow.triggerType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Action Type</p>
            <p className="mt-1 font-medium capitalize">{workflow.actionType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gas Budget</p>
            <p className="mt-1 font-medium">{workflow.gasBudget}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Gas Price</p>
            <p className="mt-1 font-medium">{workflow.maxGasPrice}</p>
          </div>
        </div>
        {workflow.nextRun && (
          <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm font-medium text-blue-500">
              Next Run: {new Date(workflow.nextRun).toLocaleString()}
            </p>
          </div>
        )}
      </Card>

      {/* Configuration Details */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <TriggerDetails type={workflow.triggerType} data={workflow.triggerData} />
        <ActionDetails type={workflow.actionType} data={workflow.actionData} />
      </div>

      {/* Gas Escrow */}
      <div className="mb-6">
        <EscrowStatsCard
          balance={gasBalance}
          workflowId={workflow.id}
        />
      </div>

      {/* Execution History */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Execution History</h2>
        <ExecutionHistoryTable logs={executions} />
      </div>
    </div>
  );
}

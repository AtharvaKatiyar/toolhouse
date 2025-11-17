'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { WorkflowSummaryCard } from '@/components/dashboard/workflow-summary-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';

interface WorkflowData {
  id: number;
  user: string;
  triggerType: 'time' | 'price' | 'wallet';
  actionType: 'native' | 'erc20' | 'contract';
  status: 'active' | 'paused' | 'failed';
  nextRun?: string;
  lastExecuted?: string;
  gasBudget: string;
  createdAt?: string;
  executionCount?: number;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [gasBalance, setGasBalance] = useState('0 DEV');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ type: 'error' | 'warning'; message: string }[]>([]);

  // Map trigger type integer to string
  const mapTriggerType = (type: number): 'time' | 'price' | 'wallet' => {
    switch (type) {
      case 1: return 'time';
      case 2: return 'price';
      case 3: return 'wallet';
      default: return 'time';
    }
  };

  // Map action type integer to string
  const mapActionType = (type: number): 'native' | 'erc20' | 'contract' => {
    switch (type) {
      case 1: return 'native';
      case 2: return 'erc20';
      case 3: return 'contract';
      default: return 'native';
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, searchParams]); // Add searchParams to trigger refresh

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setAlerts([]);

      // Fetch user workflows
      const workflowsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/user/${address}`
      );
      
      console.log('[Dashboard] Raw workflows response:', workflowsRes.data);
      
      // Ensure workflows is always an array
      const rawWorkflows = Array.isArray(workflowsRes.data) 
        ? workflowsRes.data 
        : workflowsRes.data?.workflows || [];
      
      console.log('[Dashboard] Raw workflows array:', rawWorkflows);
      
      // Transform backend response (snake_case) to frontend format (camelCase)
      const transformedWorkflows = await Promise.all(rawWorkflows.map(async (wf: any) => {
        // Fetch metadata for each workflow (creation time, execution count)
        let metadata = null;
        try {
          const metadataRes = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/metadata/${wf.id}`
          );
          metadata = metadataRes.data;
        } catch (err) {
          console.warn(`Failed to fetch metadata for workflow ${wf.id}:`, err);
        }

        return {
          id: wf.id || wf.workflow_id,
          user: wf.owner || wf.user,
          triggerType: mapTriggerType(wf.trigger_type),
          actionType: mapActionType(wf.action_type),
          status: wf.active ? 'active' : 'paused',
          nextRun: wf.next_run ? new Date(wf.next_run * 1000).toISOString() : undefined,
          lastExecuted: metadata?.last_executed ? new Date(metadata.last_executed * 1000).toISOString() : (wf.last_executed ? new Date(wf.last_executed * 1000).toISOString() : undefined),
          gasBudget: wf.gas_budget_eth ? `${wf.gas_budget_eth} DEV` : '0 DEV',
          createdAt: metadata?.created_at ? new Date(metadata.created_at * 1000).toISOString() : undefined,
          executionCount: metadata?.execution_count || 0,
        };
      }));
      
      console.log('[Dashboard] Transformed workflows:', transformedWorkflows);
      
      // Sort by ID descending (newest first)
      const sortedWorkflows = transformedWorkflows.sort((a: any, b: any) => b.id - a.id);
      
      console.log(`[Dashboard] Displaying ${sortedWorkflows.length} workflows (sorted by newest first)`);
      
      setWorkflows(sortedWorkflows);

      // Fetch gas balance
      try {
        const balanceRes = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/escrow/balance/${address}`
        );
        const balance = parseFloat(balanceRes.data.balance || '0');
        setGasBalance(`${balance.toFixed(4)} DEV`);

        // Check for low balance
        if (balance < 0.1) {
          setAlerts((prev) => [
            ...prev,
            {
              type: 'warning',
              message: 'Low gas balance! Consider depositing more funds.',
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching gas balance:', err);
      }

      // Check for failed workflows
      const failedWorkflows = transformedWorkflows.filter(
        (w: WorkflowData) => w.status === 'failed'
      );
      if (failedWorkflows.length > 0) {
        setAlerts((prev) => [
          ...prev,
          {
            type: 'error',
            message: `${failedWorkflows.length} workflow(s) have failed. Check details.`,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setWorkflows([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view your dashboard
          </p>
        </Card>
      </div>
    );
  }

  // Ensure workflows is always an array (defensive check)
  const workflowsArray = Array.isArray(workflows) ? workflows : [];
  
  const activeWorkflows = workflowsArray.filter((w) => w.status === 'active').length;
  const upcomingExecutions = workflowsArray.filter(
    (w) => w.status === 'active' && w.nextRun
  ).length;

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your automated workflows
          </p>
        </div>
        <Link href="/workflow/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                alert.type === 'error'
                  ? 'border-red-500/20 bg-red-500/10'
                  : 'border-yellow-500/20 bg-yellow-500/10'
              }`}
            >
              {alert.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <p
                className={`text-sm font-medium ${
                  alert.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`}
              >
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <DashboardStats
        totalWorkflows={workflowsArray.length}
        activeWorkflows={activeWorkflows}
        upcomingExecutions={upcomingExecutions}
        gasBalance={gasBalance}
      />

      {/* Recent Workflows */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Workflows</h2>
          <Link href="/dashboard/workflows">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : workflowsArray.length === 0 ? (
          <Card className="p-12 text-center">
            <Workflow className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No workflows yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first automation to get started
            </p>
            <Link href="/explore">
              <Button className="mt-6">Explore Templates</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workflowsArray.slice(0, 4).map((workflow) => (
              <WorkflowSummaryCard
                key={workflow.id}
                id={workflow.id}
                name={`Workflow #${workflow.id}`}
                triggerType={workflow.triggerType}
                actionType={workflow.actionType}
                status={workflow.status}
                nextRun={workflow.nextRun}
                lastExecuted={workflow.lastExecuted}
                createdAt={workflow.createdAt}
                executionCount={workflow.executionCount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/workflows">
          <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <h3 className="font-semibold">All Workflows</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View and manage all your automations
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/escrow">
          <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <h3 className="font-semibold">Gas Escrow</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your gas deposits and balance
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/transactions">
          <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <h3 className="font-semibold">Transaction History</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View detailed escrow transaction history
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/logs">
          <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <h3 className="font-semibold">Execution Logs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View automation execution history
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

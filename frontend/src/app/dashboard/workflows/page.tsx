'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TriggerIcon } from '@/components/dashboard/trigger-icon';
import { ActionIcon } from '@/components/dashboard/action-icon';
import { WorkflowStatusBadge } from '@/components/dashboard/workflow-status-badge';
import { AlertCircle, Trash2, Eye, Pause, Play, Calendar } from 'lucide-react';
import Link from 'next/link';

interface WorkflowData {
  id: number;
  user: string;
  triggerType: 'time' | 'price' | 'wallet';
  actionType: 'native' | 'erc20' | 'contract';
  status: 'active' | 'paused' | 'failed';
  nextRun?: string;
  gasBudget: string;
  maxGasPrice: string;
}

export default function WorkflowsListPage() {
  const { address, isConnected } = useAccount();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchWorkflows();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/user/${address}`
      );
      
      // Ensure workflows is always an array
      const workflowsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.workflows || [];
      
      setWorkflows(workflowsData);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setWorkflows([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async (id: number, currentStatus: string) => {
    try {
      setActionLoading(id);
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${id}/status`,
        { status: newStatus }
      );

      // Update local state
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus as any } : w))
      );
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to update workflow status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(id);
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${id}`);
      
      // Remove from local state
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to view your workflows
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">All Workflows</h1>
        <p className="mt-2 text-muted-foreground">
          Manage and monitor your automations
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No workflows yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your first automation to get started
          </p>
          <Link href="/explore">
            <Button className="mt-6">Explore Templates</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="flex items-center gap-6">
                {/* Workflow Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      Workflow #{workflow.id}
                    </h3>
                    <WorkflowStatusBadge status={workflow.status} />
                  </div>

                  <div className="mt-3 flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <TriggerIcon type={workflow.triggerType} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {workflow.triggerType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ActionIcon type={workflow.actionType} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {workflow.actionType}
                      </span>
                    </div>

                    {workflow.nextRun && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Next: {new Date(workflow.nextRun).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Gas: {workflow.gasBudget}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/workflows/${workflow.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePause(workflow.id, workflow.status)}
                    disabled={actionLoading === workflow.id}
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
                    size="sm"
                    onClick={() => handleDelete(workflow.id)}
                    disabled={actionLoading === workflow.id}
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkflowStatusBadge } from '@/components/dashboard/workflow-status-badge';
import { AlertCircle, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface ExecutionLog {
  id: number;
  workflowId: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  gasUsed: string;
  gasCost: string;
  triggerReason: string;
  result?: string;
  errorMessage?: string;
  txHash?: string;
}

export default function ExecutionLogsPage() {
  const { address, isConnected } = useAccount();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isConnected && address) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => {
    let filtered = logs;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.workflowId.toString().includes(searchQuery) ||
          log.triggerReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/executions/all?user=${address}`
      );
      setLogs(response.data || []);
      setFilteredLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
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
            Please connect your wallet to view execution logs
          </p>
        </Card>
      </div>
    );
  }

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const totalGasUsed = logs.reduce((sum, log) => sum + parseFloat(log.gasCost || '0'), 0);

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Execution Logs</h1>
        <p className="mt-2 text-muted-foreground">
          View the history of all workflow executions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Executions</p>
          <p className="mt-2 text-3xl font-bold">{logs.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Successful</p>
          <p className="mt-2 text-3xl font-bold text-green-500">{successCount}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{failedCount}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Gas Used</p>
          <p className="mt-2 text-3xl font-bold">{totalGasUsed.toFixed(4)} DEV</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by workflow ID, trigger, or error..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'success' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('success')}
              >
                Success
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('failed')}
              >
                Failed
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-20 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">
            {logs.length === 0 ? 'No Execution Logs' : 'No Results Found'}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {logs.length === 0
              ? 'Your workflows haven\'t executed yet'
              : 'Try adjusting your search or filters'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Workflow</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Trigger</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Gas Used</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Result</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/workflows/${log.workflowId}`}
                        className="font-medium hover:text-primary"
                      >
                        Workflow #{log.workflowId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.triggerReason}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' && (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-500">Success</span>
                          </>
                        )}
                        {log.status === 'failed' && (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-500">Failed</span>
                          </>
                        )}
                        {log.status === 'pending' && (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-500">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.gasUsed} ({log.gasCost} DEV)
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.errorMessage ? (
                        <span className="text-red-500">{log.errorMessage}</span>
                      ) : log.result ? (
                        <span className="text-muted-foreground">
                          {log.result.slice(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.txHash && (
                        <a
                          href={`https://moonbase.moonscan.io/tx/${log.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View TX
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

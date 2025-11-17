import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ExecutionLog {
  id: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  gasUsed: string;
  result?: string;
  errorMessage?: string;
}

interface ExecutionHistoryTableProps {
  logs: ExecutionLog[];
}

export function ExecutionHistoryTable({ logs }: ExecutionHistoryTableProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No Execution History</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This workflow hasn't been executed yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Timestamp</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Gas Used</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-muted/50">
                <td className="px-6 py-4 text-sm">
                  {new Date(log.timestamp).toLocaleString()}
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
                <td className="px-6 py-4 text-sm">{log.gasUsed}</td>
                <td className="px-6 py-4">
                  {log.errorMessage ? (
                    <span className="text-sm text-red-500">{log.errorMessage}</span>
                  ) : log.result ? (
                    <span className="text-sm text-muted-foreground">
                      {log.result.slice(0, 20)}...
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

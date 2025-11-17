import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface EscrowStatsCardProps {
  balance: string;
  dailyAverage?: string;
  weeklyAverage?: string;
  workflowId: number;
}

export function EscrowStatsCard({
  balance,
  dailyAverage,
  weeklyAverage,
  workflowId,
}: EscrowStatsCardProps) {
  const balanceNum = parseFloat(balance);
  const isLowBalance = balanceNum < 0.1;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gas Escrow</h3>
        <Fuel className="h-5 w-5 text-cyan-500" />
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">{balance} DEV</p>
        </div>

        {dailyAverage && (
          <div>
            <p className="text-sm text-muted-foreground">Daily Average Usage</p>
            <p className="text-lg font-semibold">{dailyAverage} DEV</p>
          </div>
        )}

        {weeklyAverage && (
          <div>
            <p className="text-sm text-muted-foreground">Weekly Average Usage</p>
            <p className="text-lg font-semibold">{weeklyAverage} DEV</p>
          </div>
        )}

        {isLowBalance && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-500">Low Balance Warning</p>
              <p className="mt-1 text-xs text-yellow-500/80">
                Your gas balance is running low. Consider depositing more funds.
              </p>
            </div>
          </div>
        )}

        <Link href="/dashboard/escrow">
          <Button className="w-full">Manage Gas Deposits</Button>
        </Link>
      </div>
    </Card>
  );
}

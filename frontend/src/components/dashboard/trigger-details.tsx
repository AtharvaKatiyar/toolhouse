import { Card } from '@/components/ui/card';
import { Clock, TrendingUp, Wallet } from 'lucide-react';

interface TriggerDetailsProps {
  type: 'time' | 'price' | 'wallet';
  data: any;
}

export function TriggerDetails({ type, data }: TriggerDetailsProps) {
  // Check if data is a hex string (raw blockchain data)
  const isHexString = typeof data === 'string' && data.startsWith('0x');
  
  // If data is not available or is raw hex, show placeholder
  if (!data || isHexString || typeof data !== 'object') {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Trigger Configuration</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {type === 'time' && <Clock className="h-4 w-4 text-blue-500" />}
            {type === 'price' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {type === 'wallet' && <Wallet className="h-4 w-4 text-purple-500" />}
            <span className="font-medium capitalize">{type}-based Trigger</span>
          </div>
          <div className="ml-6 text-sm text-muted-foreground">
            {isHexString ? (
              <div>
                <p className="mb-2">Configuration data (encoded):</p>
                <code className="block overflow-x-auto rounded bg-muted p-2 text-xs">
                  {data}
                </code>
              </div>
            ) : (
              <p>Configuration details not available</p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const renderTimeDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-500" />
        <span className="font-medium">Time-based Trigger</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Interval: {data.intervalValue || 'N/A'} {data.intervalType || ''}</p>
        {data.startTime && <p>Start Time: {new Date(data.startTime).toLocaleString()}</p>}
      </div>
    </div>
  );

  const renderPriceDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="font-medium">Price-based Trigger</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Token: {data.tokenSymbol}</p>
        <p>Condition: {data.operator === 'gt' ? 'Greater than' : 'Less than'}</p>
        <p>Threshold: ${data.priceThreshold}</p>
      </div>
    </div>
  );

  const renderWalletDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-purple-500" />
        <span className="font-medium">Wallet-based Trigger</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Wallet: {data.walletAddress}</p>
        <p>Event Type: {data.eventType}</p>
        {data.balanceThreshold && <p>Threshold: {data.balanceThreshold}</p>}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Trigger Configuration</h3>
      {type === 'time' && renderTimeDetails()}
      {type === 'price' && renderPriceDetails()}
      {type === 'wallet' && renderWalletDetails()}
    </Card>
  );
}

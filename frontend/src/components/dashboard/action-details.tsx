import { Card } from '@/components/ui/card';
import { Send, Coins, Code } from 'lucide-react';

interface ActionDetailsProps {
  type: 'native' | 'erc20' | 'contract';
  data: any;
}

export function ActionDetails({ type, data }: ActionDetailsProps) {
  // Check if data is a hex string (raw blockchain data)
  const isHexString = typeof data === 'string' && data.startsWith('0x');
  
  // If data is not available or is raw hex, show placeholder
  if (!data || isHexString || typeof data !== 'object') {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Action Configuration</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {type === 'native' && <Send className="h-4 w-4 text-orange-500" />}
            {type === 'erc20' && <Coins className="h-4 w-4 text-yellow-500" />}
            {type === 'contract' && <Code className="h-4 w-4 text-cyan-500" />}
            <span className="font-medium capitalize">{type === 'native' ? 'Native Transfer' : type === 'erc20' ? 'ERC20 Transfer' : 'Contract Interaction'}</span>
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

  const renderNativeDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-orange-500" />
        <span className="font-medium">Native Transfer</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Recipient: {data.recipientAddress || 'N/A'}</p>
        <p>Amount: {data.transferAmount || 'N/A'} DEV</p>
      </div>
    </div>
  );

  const renderERC20Details = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">ERC20 Transfer</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Token Contract: {data.tokenContract}</p>
        <p>Recipient: {data.recipientAddress}</p>
        <p>Amount: {data.transferAmount}</p>
      </div>
    </div>
  );

  const renderContractDetails = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-cyan-500" />
        <span className="font-medium">Contract Interaction</span>
      </div>
      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
        <p>Contract: {data.contractAddress}</p>
        <p>Function: {data.functionSelector}</p>
        {data.contractValue && <p>Value: {data.contractValue} DEV</p>}
        {data.contractParams && (
          <div>
            <p className="mb-1">Parameters:</p>
            <pre className="rounded bg-muted p-2 text-xs">
              {JSON.stringify(JSON.parse(data.contractParams), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Action Configuration</h3>
      {type === 'native' && renderNativeDetails()}
      {type === 'erc20' && renderERC20Details()}
      {type === 'contract' && renderContractDetails()}
    </Card>
  );
}

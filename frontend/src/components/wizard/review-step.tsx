'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';

interface ReviewStepProps {
  triggerType: string;
  actionType: string;
  formData: Record<string, string>;
}

export function ReviewStep({ triggerType, actionType, formData }: ReviewStepProps) {
  // Format trigger summary
  const getTriggerSummary = () => {
    if (triggerType === 'time') {
      const interval = formData.intervalValue || 'X';
      const unit = formData.intervalType || 'hours';
      return `Every ${interval} ${unit}`;
    }
    if (triggerType === 'price') {
      const token = formData.tokenSymbol || 'TOKEN';
      const operator = formData.operator === 'gt' ? '>' : '<';
      const price = formData.priceThreshold || 'X';
      return `When ${token} ${operator} $${price}`;
    }
    if (triggerType === 'wallet') {
      const eventType = formData.eventType || 'balance';
      if (eventType === 'balance') {
        return `When balance < ${formData.balanceThreshold || 'X'} DEV`;
      }
      return `On ${eventType} transfer`;
    }
    return 'Unknown trigger';
  };

  // Format action summary
  const getActionSummary = () => {
    if (actionType === 'native') {
      const amount = formData.transferAmount || 'X';
      const to = formData.recipientAddress || '0x...';
      return `Send ${amount} DEV to ${to.slice(0, 6)}...${to.slice(-4)}`;
    }
    if (actionType === 'erc20') {
      const amount = formData.transferAmount || 'X';
      const to = formData.recipientAddress || '0x...';
      return `Transfer ${amount} tokens to ${to.slice(0, 6)}...${to.slice(-4)}`;
    }
    if (actionType === 'contract') {
      const contract = formData.contractAddress || '0x...';
      const func = formData.functionSelector || 'function';
      return `Call ${func} on ${contract.slice(0, 6)}...${contract.slice(-4)}`;
    }
    return 'Unknown action';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Your Workflow</h2>
        <p className="mt-2 text-muted-foreground">
          Check all details before creating your automation
        </p>
      </div>

      {/* Quick Summary */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Workflow Summary
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">WHEN</p>
            <p className="text-lg font-medium">{getTriggerSummary()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">THEN</p>
            <p className="text-lg font-medium">{getActionSummary()}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Detailed Trigger Configuration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Trigger Configuration</h3>
          <Badge variant="outline">
            {triggerType === 'time' && '⏰ Time'}
            {triggerType === 'price' && '💰 Price'}
            {triggerType === 'wallet' && '👛 Wallet'}
          </Badge>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
          <dl className="space-y-2 text-sm">
            {triggerType === 'time' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Interval:</dt>
                  <dd className="font-medium">{formData.intervalValue} {formData.intervalType}</dd>
                </div>
                {formData.startTime && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Start Time:</dt>
                    <dd className="font-medium">{new Date(formData.startTime).toLocaleString()}</dd>
                  </div>
                )}
              </>
            )}
            {triggerType === 'price' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Token:</dt>
                  <dd className="font-medium">{formData.tokenSymbol}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Condition:</dt>
                  <dd className="font-medium">
                    {formData.operator === 'gt' ? 'Greater than' : 'Less than'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Price Threshold:</dt>
                  <dd className="font-medium">${formData.priceThreshold}</dd>
                </div>
              </>
            )}
            {triggerType === 'wallet' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Wallet:</dt>
                  <dd className="font-mono text-xs">{formData.walletAddress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Event Type:</dt>
                  <dd className="font-medium capitalize">{formData.eventType}</dd>
                </div>
                {formData.eventType === 'balance' && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Threshold:</dt>
                    <dd className="font-medium">{formData.balanceThreshold} DEV</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      <Separator />

      {/* Detailed Action Configuration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Action Configuration</h3>
          <Badge variant="outline">
            {actionType === 'native' && '→ Native'}
            {actionType === 'erc20' && '🪙 ERC20'}
            {actionType === 'contract' && '⚙️ Contract'}
          </Badge>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
          <dl className="space-y-2 text-sm">
            {actionType === 'native' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Recipient:</dt>
                  <dd className="font-mono text-xs">{formData.recipientAddress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount:</dt>
                  <dd className="font-medium">{formData.transferAmount} DEV</dd>
                </div>
              </>
            )}
            {actionType === 'erc20' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Token Contract:</dt>
                  <dd className="font-mono text-xs">{formData.tokenContract}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Recipient:</dt>
                  <dd className="font-mono text-xs">{formData.recipientAddress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount:</dt>
                  <dd className="font-medium">{formData.transferAmount}</dd>
                </div>
              </>
            )}
            {actionType === 'contract' && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Contract:</dt>
                  <dd className="font-mono text-xs">{formData.contractAddress}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Function:</dt>
                  <dd className="font-mono text-xs">{formData.functionSelector}</dd>
                </div>
                {formData.contractParams && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Parameters:</dt>
                    <dd className="font-mono text-xs">{formData.contractParams}</dd>
                  </div>
                )}
                {formData.contractValue && formData.contractValue !== '0' && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Value:</dt>
                    <dd className="font-medium">{formData.contractValue} DEV</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>

      <Separator />

      {/* Gas Budget */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Gas Budget</h3>
        <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Gas Budget:</dt>
              <dd className="font-medium">{Number(formData.gasBudget || 0).toLocaleString()} units</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Max Gas Price:</dt>
              <dd className="font-medium">{(Number(formData.maxGasPrice || 0) / 1e9).toFixed(2)} gwei</dd>
            </div>
            <div className="flex justify-between border-t border-border/40 pt-2 font-semibold">
              <dt className="text-muted-foreground">Est. Cost/Execution:</dt>
              <dd className="text-primary">
                ~{((Number(formData.gasBudget || 0) * Number(formData.maxGasPrice || 0)) / 1e18).toFixed(6)} DEV
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

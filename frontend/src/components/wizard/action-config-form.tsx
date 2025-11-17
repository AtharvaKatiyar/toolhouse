'use client';

interface ActionConfigFormProps {
  actionType: 'native' | 'erc20' | 'contract';
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function ActionConfigForm({ actionType, formData, errors, onChange }: ActionConfigFormProps) {
  if (actionType === 'native') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure Native Transfer</h2>
          <p className="mt-2 text-muted-foreground">
            Set up your token transfer details
          </p>
        </div>

        <div className="space-y-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recipient Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.recipientAddress || ''}
              onChange={(e) => onChange('recipientAddress', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.recipientAddress ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.recipientAddress && (
              <p className="text-xs text-red-500">{errors.recipientAddress}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The wallet address that will receive tokens
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Amount (DEV) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 10"
              value={formData.transferAmount || ''}
              onChange={(e) => onChange('transferAmount', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.transferAmount ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.transferAmount && (
              <p className="text-xs text-red-500">{errors.transferAmount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Amount of native tokens to transfer
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (actionType === 'erc20') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure ERC20 Transfer</h2>
          <p className="mt-2 text-muted-foreground">
            Set up your ERC20 token transfer
          </p>
        </div>

        <div className="space-y-4">
          {/* Token Contract */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Token Contract Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.tokenContract || ''}
              onChange={(e) => onChange('tokenContract', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.tokenContract ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.tokenContract && (
              <p className="text-xs text-red-500">{errors.tokenContract}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The ERC20 token contract address
            </p>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recipient Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.recipientAddress || ''}
              onChange={(e) => onChange('recipientAddress', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.recipientAddress ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.recipientAddress && (
              <p className="text-xs text-red-500">{errors.recipientAddress}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 100"
              value={formData.transferAmount || ''}
              onChange={(e) => onChange('transferAmount', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.transferAmount ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.transferAmount && (
              <p className="text-xs text-red-500">{errors.transferAmount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Amount in token's smallest unit (consider decimals)
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (actionType === 'contract') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure Contract Call</h2>
          <p className="mt-2 text-muted-foreground">
            Set up your smart contract interaction
          </p>
        </div>

        <div className="space-y-4">
          {/* Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Contract Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.contractAddress || ''}
              onChange={(e) => onChange('contractAddress', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.contractAddress ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.contractAddress && (
              <p className="text-xs text-red-500">{errors.contractAddress}</p>
            )}
          </div>

          {/* Function Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Function Selector <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., claimRewards() or 0x4e71d92d"
              value={formData.functionSelector || ''}
              onChange={(e) => onChange('functionSelector', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.functionSelector ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.functionSelector && (
              <p className="text-xs text-red-500">{errors.functionSelector}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Function name or 4-byte selector (e.g., 0x12345678)
            </p>
          </div>

          {/* Parameters (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Parameters (Optional)
            </label>
            <textarea
              placeholder="Enter parameters as JSON array, e.g., [100, &quot;0x123...&quot;]"
              value={formData.contractParams || ''}
              onChange={(e) => onChange('contractParams', e.target.value)}
              rows={4}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.contractParams ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.contractParams && (
              <p className="text-xs text-red-500">{errors.contractParams}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty if function takes no parameters
            </p>
          </div>

          {/* Value (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Value to Send (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.contractValue || ''}
              onChange={(e) => onChange('contractValue', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Amount of native tokens to send with the call (payable functions)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

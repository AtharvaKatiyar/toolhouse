'use client';

interface TriggerConfigFormProps {
  triggerType: 'time' | 'price' | 'wallet';
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function TriggerConfigForm({ triggerType, formData, errors, onChange }: TriggerConfigFormProps) {
  if (triggerType === 'time') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure Time Trigger</h2>
          <p className="mt-2 text-muted-foreground">
            Set when and how often your automation should run
          </p>
        </div>

        <div className="space-y-4">
          {/* Interval Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Interval Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.intervalType || 'hours'}
              onChange={(e) => onChange('intervalType', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>

          {/* Interval Value */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Interval Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 24"
              value={formData.intervalValue || ''}
              onChange={(e) => onChange('intervalValue', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.intervalValue ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.intervalValue && (
              <p className="text-xs text-red-500">{errors.intervalValue}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Run every {formData.intervalValue || 'X'} {formData.intervalType || 'hours'}
            </p>
          </div>

          {/* Start Time (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Start Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.startTime || ''}
              onChange={(e) => onChange('startTime', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to start immediately
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (triggerType === 'price') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure Price Trigger</h2>
          <p className="mt-2 text-muted-foreground">
            Set price conditions for your automation
          </p>
        </div>

        <div className="space-y-4">
          {/* Token Symbol */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Token Symbol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., GLMR"
              value={formData.tokenSymbol || ''}
              onChange={(e) => onChange('tokenSymbol', e.target.value.toUpperCase())}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.tokenSymbol ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.tokenSymbol && (
              <p className="text-xs text-red-500">{errors.tokenSymbol}</p>
            )}
          </div>

          {/* Operator */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.operator || 'gt'}
              onChange={(e) => onChange('operator', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="gt">Greater than (&gt;)</option>
              <option value="lt">Less than (&lt;)</option>
            </select>
          </div>

          {/* Price Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Price Threshold (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 0.50"
              value={formData.priceThreshold || ''}
              onChange={(e) => onChange('priceThreshold', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.priceThreshold ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.priceThreshold && (
              <p className="text-xs text-red-500">{errors.priceThreshold}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Trigger when {formData.tokenSymbol || 'token'} price is {formData.operator === 'gt' ? 'greater than' : 'less than'} ${formData.priceThreshold || 'X'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (triggerType === 'wallet') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configure Wallet Event Trigger</h2>
          <p className="mt-2 text-muted-foreground">
            Monitor wallet events and balances
          </p>
        </div>

        <div className="space-y-4">
          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Wallet Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.walletAddress || ''}
              onChange={(e) => onChange('walletAddress', e.target.value)}
              className={`
                w-full rounded-lg border bg-background px-4 py-2 transition-all font-mono text-sm
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                ${errors.walletAddress ? 'border-red-500' : 'border-border/40'}
              `}
            />
            {errors.walletAddress && (
              <p className="text-xs text-red-500">{errors.walletAddress}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.eventType || 'balance'}
              onChange={(e) => onChange('eventType', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="balance">Balance Below Threshold</option>
              <option value="incoming">Incoming Transfer</option>
              <option value="outgoing">Outgoing Transfer</option>
            </select>
          </div>

          {/* Balance Threshold (if balance event type) */}
          {formData.eventType === 'balance' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 10"
                value={formData.balanceThreshold || ''}
                onChange={(e) => onChange('balanceThreshold', e.target.value)}
                className={`
                  w-full rounded-lg border bg-background px-4 py-2 transition-all
                  focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                  ${errors.balanceThreshold ? 'border-red-500' : 'border-border/40'}
                `}
              />
              {errors.balanceThreshold && (
                <p className="text-xs text-red-500">{errors.balanceThreshold}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Trigger when balance falls below this amount
              </p>
            </div>
          )}

          {/* Token (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Token (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty for native token"
              value={formData.walletToken || ''}
              onChange={(e) => onChange('walletToken', e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-background px-4 py-2 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Specific ERC20 token to monitor (leave empty for native DEV)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

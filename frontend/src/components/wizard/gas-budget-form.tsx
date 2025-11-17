'use client';

interface GasBudgetFormProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function GasBudgetForm({ formData, errors, onChange }: GasBudgetFormProps) {
  const gasBudget = formData.gasBudget || '100000';
  const maxGasPrice = formData.maxGasPrice || '1000000000'; // 1 gwei
  const estimatedCost = (Number(gasBudget) * Number(maxGasPrice) / 1e18).toFixed(6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set Gas Budget</h2>
        <p className="mt-2 text-muted-foreground">
          Configure gas limits for your automation
        </p>
      </div>

      <div className="space-y-4">
        {/* Gas Budget */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Gas Budget (units) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="21000"
            step="1000"
            placeholder="100000"
            value={formData.gasBudget || ''}
            onChange={(e) => onChange('gasBudget', e.target.value)}
            className={`
              w-full rounded-lg border bg-background px-4 py-2 transition-all
              focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
              ${errors.gasBudget ? 'border-red-500' : 'border-border/40'}
            `}
          />
          {errors.gasBudget && (
            <p className="text-xs text-red-500">{errors.gasBudget}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Maximum gas units per execution (min: 21000 for transfers)
          </p>
        </div>

        {/* Max Gas Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Max Gas Price (wei) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1000000"
            placeholder="1000000000"
            value={formData.maxGasPrice || ''}
            onChange={(e) => onChange('maxGasPrice', e.target.value)}
            className={`
              w-full rounded-lg border bg-background px-4 py-2 transition-all
              focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
              ${errors.maxGasPrice ? 'border-red-500' : 'border-border/40'}
            `}
          />
          {errors.maxGasPrice && (
            <p className="text-xs text-red-500">{errors.maxGasPrice}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Maximum gas price in wei (1 gwei = 1,000,000,000 wei)
          </p>
        </div>

        {/* Estimated Cost Display */}
        <div className="rounded-lg border border-border/40 bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-4">
          <h3 className="mb-3 text-sm font-semibold">Estimated Cost Per Execution</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Budget:</span>
              <span className="font-mono">{Number(gasBudget).toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Gas Price:</span>
              <span className="font-mono">{(Number(maxGasPrice) / 1e9).toFixed(2)} gwei</span>
            </div>
            <div className="border-t border-border/40 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Max Cost:</span>
                <span className="font-mono text-primary">~{estimatedCost} DEV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow Reminder */}
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Deposit Required</p>
              <p className="text-xs text-muted-foreground">
                You'll need to deposit gas fees to the escrow contract after creating your workflow. 
                We recommend depositing enough for at least 10 executions.
              </p>
              <p className="mt-2 text-xs font-medium text-primary">
                Recommended deposit: {(Number(estimatedCost) * 10).toFixed(4)} DEV
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Coins, Code } from 'lucide-react';

interface ActionSelectionProps {
  selectedAction: string | null;
  onSelect: (action: 'native' | 'erc20' | 'contract') => void;
}

export function ActionSelection({ selectedAction, onSelect }: ActionSelectionProps) {
  const actions = [
    {
      type: 'native' as const,
      icon: Send,
      title: 'Native Transfer',
      description: 'Send native tokens (DEV, GLMR) to an address',
      examples: ['Send 10 DEV to wallet', 'Transfer funds automatically'],
      badge: 'Simple'
    },
    {
      type: 'erc20' as const,
      icon: Coins,
      title: 'ERC20 Transfer',
      description: 'Send ERC20 tokens to an address',
      examples: ['Transfer USDC', 'Send custom tokens'],
      badge: 'Popular'
    },
    {
      type: 'contract' as const,
      icon: Code,
      title: 'Contract Call',
      description: 'Call any smart contract function',
      examples: ['Claim rewards', 'Execute swap', 'Custom contract interaction'],
      badge: 'Advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Action</h2>
        <p className="mt-2 text-muted-foreground">
          Select what happens when your trigger fires
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const IconComponent = action.icon;
          const isSelected = selectedAction === action.type;

          return (
            <button
              key={action.type}
              onClick={() => onSelect(action.type)}
              className="text-left"
            >
              <Card className={`
                h-full transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5
                ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border/40'}
              `}>
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`
                      rounded-lg p-3 ring-1 ring-white/10
                      ${isSelected ? 'bg-primary/20' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'}
                    `}>
                      <IconComponent className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                    </div>
                    <Badge variant={isSelected ? 'default' : 'outline'}>
                      {action.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Examples:</p>
                    {action.examples.map((example, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">• {example}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

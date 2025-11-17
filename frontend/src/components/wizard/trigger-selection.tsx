'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Activity } from 'lucide-react';

interface TriggerSelectionProps {
  selectedTrigger: string | null;
  onSelect: (trigger: 'time' | 'price' | 'wallet') => void;
}

export function TriggerSelection({ selectedTrigger, onSelect }: TriggerSelectionProps) {
  const triggers = [
    {
      type: 'time' as const,
      icon: Clock,
      title: 'Time-Based Trigger',
      description: 'Run your workflow at regular intervals',
      examples: ['Every 24 hours', 'Every week', 'Every month'],
      badge: 'Simple'
    },
    {
      type: 'price' as const,
      icon: DollarSign,
      title: 'Price Trigger',
      description: 'Trigger when token price crosses threshold',
      examples: ['When ETH > $3500', 'When GLMR < $0.50'],
      badge: 'Popular'
    },
    {
      type: 'wallet' as const,
      icon: Activity,
      title: 'Wallet Event Trigger',
      description: 'React to wallet balance or transaction events',
      examples: ['When balance < 10 DEV', 'When receive funds'],
      badge: 'Advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Trigger</h2>
        <p className="mt-2 text-muted-foreground">
          Select when you want your automation to run
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {triggers.map((trigger) => {
          const IconComponent = trigger.icon;
          const isSelected = selectedTrigger === trigger.type;

          return (
            <button
              key={trigger.type}
              onClick={() => onSelect(trigger.type)}
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
                      {trigger.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{trigger.title}</CardTitle>
                  <CardDescription>{trigger.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Examples:</p>
                    {trigger.examples.map((example, idx) => (
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

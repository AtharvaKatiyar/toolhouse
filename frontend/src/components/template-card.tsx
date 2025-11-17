'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingDown, 
  Wallet, 
  BarChart3, 
  Bell, 
  Repeat, 
  PieChart, 
  Coins,
  ArrowRight,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import type { Template } from '@/data/templates';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  TrendingDown,
  Wallet,
  BarChart3,
  Bell,
  Repeat,
  PieChart,
  Coins,
  Clock,
  DollarSign,
  Activity
};

// Trigger type colors
const triggerColors: Record<string, string> = {
  time: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  price: 'bg-green-500/10 text-green-500 border-green-500/20',
  wallet: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

// Action type colors
const actionColors: Record<string, string> = {
  native: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  erc20: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  contract: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
};

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const IconComponent = iconMap[template.icon] || Calendar;

  return (
    <Card className="group relative overflow-hidden border-border/40 bg-card/50 backdrop-blur transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Popular badge */}
      {template.popular && (
        <div className="absolute right-4 top-4 z-10">
          <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500">
            Popular
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-4">
        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-3 ring-1 ring-white/10">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {template.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {template.shortDescription}
          </CardDescription>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className={triggerColors[template.triggerType]}
          >
            {template.triggerType === 'time' && '⏰ Time'}
            {template.triggerType === 'price' && '💰 Price'}
            {template.triggerType === 'wallet' && '👛 Wallet'}
          </Badge>
          <Badge 
            variant="outline" 
            className={actionColors[template.actionType]}
          >
            {template.actionType === 'native' && '→ Transfer'}
            {template.actionType === 'erc20' && '🪙 ERC20'}
            {template.actionType === 'contract' && '⚙️ Contract'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{template.category}</span>
        </div>

        {/* CTA Button */}
        <Link href={`/automation/${template.slug}`} className="block">
          <Button className="w-full group/btn" variant="default">
            Use Template
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardContent>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  );
}

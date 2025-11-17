import { Clock, TrendingUp, Wallet, LucideIcon } from 'lucide-react';

interface TriggerIconProps {
  type: 'time' | 'price' | 'wallet';
  className?: string;
}

export function TriggerIcon({ type, className = 'h-5 w-5' }: TriggerIconProps) {
  const iconMap: Record<string, LucideIcon> = {
    time: Clock,
    price: TrendingUp,
    wallet: Wallet,
  };

  const colorMap: Record<string, string> = {
    time: 'text-blue-500',
    price: 'text-green-500',
    wallet: 'text-purple-500',
  };

  const Icon = iconMap[type] || Clock;

  return <Icon className={`${className} ${colorMap[type]}`} />;
}

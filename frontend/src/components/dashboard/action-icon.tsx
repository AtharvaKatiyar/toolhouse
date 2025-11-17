import { Send, Coins, Code, LucideIcon } from 'lucide-react';

interface ActionIconProps {
  type: 'native' | 'erc20' | 'contract';
  className?: string;
}

export function ActionIcon({ type, className = 'h-5 w-5' }: ActionIconProps) {
  const iconMap: Record<string, LucideIcon> = {
    native: Send,
    erc20: Coins,
    contract: Code,
  };

  const colorMap: Record<string, string> = {
    native: 'text-orange-500',
    erc20: 'text-yellow-500',
    contract: 'text-cyan-500',
  };

  const Icon = iconMap[type] || Send;

  return <Icon className={`${className} ${colorMap[type]}`} />;
}

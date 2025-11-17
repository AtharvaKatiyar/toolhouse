'use client';

import { Card } from '@/components/ui/card';
import { Workflow, Play, Clock, Fuel } from 'lucide-react';

interface DashboardStatsProps {
  totalWorkflows: number;
  activeWorkflows: number;
  upcomingExecutions: number;
  gasBalance: string;
}

export function DashboardStats({
  totalWorkflows,
  activeWorkflows,
  upcomingExecutions,
  gasBalance,
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Workflows',
      value: totalWorkflows,
      icon: Workflow,
      gradient: 'from-purple-500 to-blue-500',
    },
    {
      label: 'Active Workflows',
      value: activeWorkflows,
      icon: Play,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Upcoming Executions',
      value: upcomingExecutions,
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      label: 'Gas Balance',
      value: gasBalance,
      icon: Fuel,
      gradient: 'from-cyan-500 to-blue-500',
      isBalance: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {stat.isBalance ? stat.value : stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg bg-gradient-to-br ${stat.gradient} p-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

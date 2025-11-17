'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTemplateBySlug } from '@/data/templates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  TrendingDown, 
  Wallet, 
  BarChart3, 
  Bell, 
  Repeat, 
  PieChart, 
  Coins,
  ArrowLeft,
  Rocket,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useState } from 'react';
import { TemplateSetupWizard } from '@/components/template-setup-wizard';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  TrendingDown,
  Wallet,
  BarChart3,
  Bell,
  Repeat,
  PieChart,
  Coins
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AutomationDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const template = getTemplateBySlug(slug);
  const [showWizard, setShowWizard] = useState(false);

  if (!template) {
    notFound();
  }

  const IconComponent = iconMap[template.icon] || Calendar;

  if (showWizard) {
    return <TemplateSetupWizard template={template} onCancel={() => setShowWizard(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Back button */}
      <Link 
        href="/explore" 
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4 ring-1 ring-white/10">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold">{template.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {template.fullDescription}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {template.popular && (
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">
                  Popular
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {template.category}
              </Badge>
              <Badge variant="outline">
                {template.triggerType === 'time' && '⏰ Time Trigger'}
                {template.triggerType === 'price' && '💰 Price Trigger'}
                {template.triggerType === 'wallet' && '👛 Wallet Trigger'}
              </Badge>
              <Badge variant="outline">
                {template.actionType === 'native' && '→ Native Transfer'}
                {template.actionType === 'erc20' && '🪙 ERC20 Transfer'}
                {template.actionType === 'contract' && '⚙️ Contract Call'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Use Case */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Use Case</h2>
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{template.useCase}</p>
              </CardContent>
            </Card>
          </div>

          {/* Example */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Example</h2>
            <Card className="border-border/40 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-muted-foreground">{template.example}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Required Parameters */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">What You'll Need to Configure</h2>
            <div className="space-y-3">
              {template.parameters.map((param, idx) => (
                <Card key={idx} className="border-border/40 bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      {param.label}
                      {!param.required && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                    </CardTitle>
                    {param.description && (
                      <CardDescription>{param.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* CTA Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Ready to automate?
                </CardTitle>
                <CardDescription>
                  Set up this automation in just a few steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setShowWizard(true)}
                >
                  Use This Automation
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll need to connect your wallet and deposit gas fees
                </p>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      1
                    </div>
                    <p className="text-muted-foreground">
                      Configure your automation parameters
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      2
                    </div>
                    <p className="text-muted-foreground">
                      Connect wallet and approve creation
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      3
                    </div>
                    <p className="text-muted-foreground">
                      Deposit gas fees to escrow
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      4
                    </div>
                    <p className="text-muted-foreground">
                      Relax and let automation run 24/7
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/docs" className="block text-sm text-primary hover:underline">
                  → View Documentation
                </Link>
                <Link href="/examples" className="block text-sm text-primary hover:underline">
                  → See Examples
                </Link>
                <Link href="/community" className="block text-sm text-primary hover:underline">
                  → Join Community
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

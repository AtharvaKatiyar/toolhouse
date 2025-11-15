'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  DollarSign, 
  Wallet, 
  Code, 
  Shield,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Bell
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Built on Moonbeam
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              Automate Your{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Blockchain
              </span>
              {' '}Workflows
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create powerful automations without writing code. Set triggers based on time, 
              prices, or wallet events, and execute actions automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/explore">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                  Explore Automations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-purple-600">1000+</div>
                <div className="text-sm text-muted-foreground">Workflows</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate your blockchain workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Time-Based Triggers</CardTitle>
                <CardDescription>
                  Schedule actions to execute at specific times or intervals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Price Alerts</CardTitle>
                <CardDescription>
                  Execute actions when crypto prices reach your target levels
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Wallet className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Wallet Events</CardTitle>
                <CardDescription>
                  Trigger actions based on wallet balance changes and transactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>No-Code Builder</CardTitle>
                <CardDescription>
                  Create complex workflows without writing a single line of code
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Your workflows run on-chain with decentralized execution
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-yellow-600 mb-2" />
                <CardTitle>Instant Execution</CardTitle>
                <CardDescription>
                  Actions execute immediately when trigger conditions are met
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create powerful automations in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/10 mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Trigger</h3>
              <p className="text-muted-foreground">
                Select from time-based, price-based, or wallet event triggers
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Define an Action</h3>
              <p className="text-muted-foreground">
                Choose what happens: send tokens, call contracts, or transfer assets
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-600/10 mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sit Back & Relax</h3>
              <p className="text-muted-foreground">
                Your workflow executes automatically when conditions are met
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Use Cases</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what you can build with Autometa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>DCA (Dollar Cost Average)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatically buy your favorite tokens at regular intervals. 
                  Set it once and invest consistently without manual effort.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-8 w-8 text-yellow-600 mb-2" />
                <CardTitle>Price Alerts with Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Don't just get notified about price changes - automatically execute 
                  trades when your target prices are reached.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wallet className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Automatic Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set up recurring payments for subscriptions, salaries, or bills. 
                  Never miss a payment deadline again.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Portfolio Rebalancing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatically maintain your desired asset allocation. 
                  Trigger rebalancing when your portfolio drifts from targets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-3xl mx-auto text-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
            <CardHeader className="space-y-4 py-12">
              <CardTitle className="text-3xl">Ready to Automate?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of users automating their blockchain workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/explore">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                    Start Building
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    View Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// Template data structure for automation library

export type TriggerType = 'time' | 'price' | 'wallet';
export type ActionType = 'native' | 'erc20' | 'contract';
export type Category = 'defi' | 'payments' | 'alerts' | 'portfolio';

export interface TemplateParameter {
  name: string;
  type: 'address' | 'amount' | 'token' | 'price' | 'interval' | 'string';
  label: string;
  placeholder: string;
  required: boolean;
  description?: string;
}

export interface Template {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: Category;
  triggerType: TriggerType;
  actionType: ActionType;
  icon: string; // Lucide icon name
  parameters: TemplateParameter[];
  useCase: string;
  example: string;
  popular?: boolean;
}

export const templates: Template[] = [
  {
    id: '1',
    slug: 'daily-transfer',
    title: 'Send Tokens Every Day',
    shortDescription: 'Automatically send a fixed amount of tokens to an address every 24 hours.',
    fullDescription: 'Set up a recurring daily transfer to any wallet address. Perfect for automated allowances, subscriptions, or recurring payments.',
    category: 'payments',
    triggerType: 'time',
    actionType: 'native',
    icon: 'Calendar',
    popular: true,
    parameters: [
      {
        name: 'recipientAddress',
        type: 'address',
        label: 'Recipient Address',
        placeholder: '0x...',
        required: true,
        description: 'The wallet address that will receive tokens'
      },
      {
        name: 'amount',
        type: 'amount',
        label: 'Amount',
        placeholder: '1.0',
        required: true,
        description: 'Amount of tokens to send (in DEV)'
      },
      {
        name: 'startTime',
        type: 'string',
        label: 'Start Time (optional)',
        placeholder: 'Leave empty to start now',
        required: false,
        description: 'When to start the automation (ISO format)'
      }
    ],
    useCase: 'Perfect for automated allowances, subscriptions, or recurring payments to employees, contractors, or service providers.',
    example: 'Send 100 DEV to your child\'s wallet every day as an automated allowance.'
  },
  {
    id: '2',
    slug: 'price-based-buy',
    title: 'Buy When Price Drops',
    shortDescription: 'Automatically purchase a token when its price falls below your target.',
    fullDescription: 'Monitor token prices and automatically execute a buy order when the price drops below your specified threshold. Never miss a dip again.',
    category: 'defi',
    triggerType: 'price',
    actionType: 'contract',
    icon: 'TrendingDown',
    popular: true,
    parameters: [
      {
        name: 'token',
        type: 'token',
        label: 'Token Symbol',
        placeholder: 'GLMR',
        required: true,
        description: 'The token you want to monitor'
      },
      {
        name: 'thresholdPrice',
        type: 'price',
        label: 'Threshold Price (USD)',
        placeholder: '0.50',
        required: true,
        description: 'Buy when price goes below this value'
      },
      {
        name: 'buyAmount',
        type: 'amount',
        label: 'Buy Amount',
        placeholder: '100',
        required: true,
        description: 'How much to spend (in DEV)'
      }
    ],
    useCase: 'Ideal for DeFi traders who want to buy the dip automatically without constantly monitoring prices.',
    example: 'Buy $100 worth of GLMR whenever the price drops below $0.50.'
  },
  {
    id: '3',
    slug: 'wallet-auto-refill',
    title: 'Auto-Refill Wallet',
    shortDescription: 'Keep a wallet topped up by automatically sending funds when balance is low.',
    fullDescription: 'Monitor a wallet\'s balance and automatically refill it when it drops below a minimum threshold. Great for operational wallets that need constant funding.',
    category: 'payments',
    triggerType: 'wallet',
    actionType: 'native',
    icon: 'Wallet',
    parameters: [
      {
        name: 'walletAddress',
        type: 'address',
        label: 'Wallet to Monitor',
        placeholder: '0x...',
        required: true,
        description: 'The wallet address to keep funded'
      },
      {
        name: 'minimumBalance',
        type: 'amount',
        label: 'Minimum Balance',
        placeholder: '10',
        required: true,
        description: 'Trigger refill when balance drops below this'
      },
      {
        name: 'refillAmount',
        type: 'amount',
        label: 'Refill Amount',
        placeholder: '50',
        required: true,
        description: 'How much to send when refilling'
      }
    ],
    useCase: 'Essential for keeping operational wallets, bot wallets, or gas fee wallets always funded.',
    example: 'Keep your trading bot wallet above 10 DEV by auto-refilling 50 DEV whenever it runs low.'
  },
  {
    id: '4',
    slug: 'dca-weekly',
    title: 'Weekly DCA (Dollar Cost Average)',
    shortDescription: 'Invest a fixed amount in a token every week automatically.',
    fullDescription: 'Implement a dollar-cost averaging strategy by automatically purchasing a fixed amount of tokens at regular intervals, regardless of price.',
    category: 'defi',
    triggerType: 'time',
    actionType: 'contract',
    icon: 'BarChart3',
    popular: true,
    parameters: [
      {
        name: 'token',
        type: 'token',
        label: 'Token Symbol',
        placeholder: 'GLMR',
        required: true,
        description: 'The token to purchase'
      },
      {
        name: 'investAmount',
        type: 'amount',
        label: 'Weekly Investment',
        placeholder: '100',
        required: true,
        description: 'Amount to invest each week (in DEV)'
      },
      {
        name: 'startDay',
        type: 'string',
        label: 'Day of Week',
        placeholder: 'Monday',
        required: true,
        description: 'Which day to execute purchases'
      }
    ],
    useCase: 'Perfect for long-term investors who want to build positions over time without timing the market.',
    example: 'Invest $100 in GLMR every Monday, building your position over months.'
  },
  {
    id: '5',
    slug: 'price-alert-transfer',
    title: 'Price Alert with Auto-Transfer',
    shortDescription: 'Send funds to yourself when a token hits your target price.',
    fullDescription: 'Monitor token prices and automatically transfer funds to a specified address when your price target is reached. Perfect for taking profits or securing gains.',
    category: 'alerts',
    triggerType: 'price',
    actionType: 'native',
    icon: 'Bell',
    parameters: [
      {
        name: 'token',
        type: 'token',
        label: 'Token Symbol',
        placeholder: 'GLMR',
        required: true,
        description: 'The token to monitor'
      },
      {
        name: 'targetPrice',
        type: 'price',
        label: 'Target Price (USD)',
        placeholder: '2.00',
        required: true,
        description: 'Trigger when price reaches this value'
      },
      {
        name: 'recipientAddress',
        type: 'address',
        label: 'Recipient Address',
        placeholder: '0x...',
        required: true,
        description: 'Where to send the alert transfer'
      },
      {
        name: 'amount',
        type: 'amount',
        label: 'Transfer Amount',
        placeholder: '10',
        required: true,
        description: 'Amount to transfer as alert signal'
      }
    ],
    useCase: 'Get notified via on-chain transfer when tokens hit your price targets, triggering further automations.',
    example: 'Send yourself 10 DEV when GLMR reaches $2.00, signaling your sell target.'
  },
  {
    id: '6',
    slug: 'recurring-payment',
    title: 'Monthly Recurring Payment',
    shortDescription: 'Set up automatic monthly payments to any address.',
    fullDescription: 'Create monthly subscriptions or payments that execute automatically on a specific day each month. Perfect for salaries, rent, or subscription services.',
    category: 'payments',
    triggerType: 'time',
    actionType: 'native',
    icon: 'Repeat',
    parameters: [
      {
        name: 'recipientAddress',
        type: 'address',
        label: 'Recipient Address',
        placeholder: '0x...',
        required: true,
        description: 'Who receives the payment'
      },
      {
        name: 'amount',
        type: 'amount',
        label: 'Payment Amount',
        placeholder: '1000',
        required: true,
        description: 'Amount to pay each month'
      },
      {
        name: 'dayOfMonth',
        type: 'string',
        label: 'Day of Month',
        placeholder: '1',
        required: true,
        description: 'Which day to execute payment (1-31)'
      }
    ],
    useCase: 'Ideal for automated salary payments, rent, subscriptions, or any monthly obligation.',
    example: 'Pay your employee 1000 DEV on the 1st of every month automatically.'
  },
  {
    id: '7',
    slug: 'portfolio-rebalance',
    title: 'Portfolio Auto-Rebalance',
    shortDescription: 'Automatically rebalance your portfolio when allocations drift.',
    fullDescription: 'Monitor your portfolio allocations and automatically execute trades to rebalance when your holdings drift from target percentages.',
    category: 'portfolio',
    triggerType: 'price',
    actionType: 'contract',
    icon: 'PieChart',
    parameters: [
      {
        name: 'tokenA',
        type: 'token',
        label: 'Token A',
        placeholder: 'GLMR',
        required: true,
        description: 'First token in portfolio'
      },
      {
        name: 'tokenB',
        type: 'token',
        label: 'Token B',
        placeholder: 'DEV',
        required: true,
        description: 'Second token in portfolio'
      },
      {
        name: 'targetRatio',
        type: 'string',
        label: 'Target Ratio (A:B)',
        placeholder: '60:40',
        required: true,
        description: 'Desired allocation ratio'
      },
      {
        name: 'driftThreshold',
        type: 'string',
        label: 'Drift Threshold %',
        placeholder: '5',
        required: true,
        description: 'Rebalance when drift exceeds this %'
      }
    ],
    useCase: 'Advanced portfolio management for maintaining optimal asset allocation without manual intervention.',
    example: 'Keep a 60/40 GLMR/DEV split, rebalancing whenever it drifts more than 5%.'
  },
  {
    id: '8',
    slug: 'yield-claim',
    title: 'Auto-Claim Staking Rewards',
    shortDescription: 'Automatically claim and compound your staking rewards.',
    fullDescription: 'Monitor your staking positions and automatically claim rewards at optimal intervals, optionally restaking them for compound growth.',
    category: 'defi',
    triggerType: 'time',
    actionType: 'contract',
    icon: 'Coins',
    parameters: [
      {
        name: 'stakingContract',
        type: 'address',
        label: 'Staking Contract',
        placeholder: '0x...',
        required: true,
        description: 'The staking contract address'
      },
      {
        name: 'claimInterval',
        type: 'interval',
        label: 'Claim Interval (days)',
        placeholder: '7',
        required: true,
        description: 'How often to claim rewards'
      },
      {
        name: 'autoCompound',
        type: 'string',
        label: 'Auto-Compound?',
        placeholder: 'yes',
        required: false,
        description: 'Automatically restake claimed rewards'
      }
    ],
    useCase: 'Maximize yields by automatically claiming and compounding staking rewards at regular intervals.',
    example: 'Claim staking rewards every 7 days and automatically restake them for compound growth.'
  }
];

// Helper functions
export function getTemplateBySlug(slug: string): Template | undefined {
  return templates.find(t => t.slug === slug);
}

export function getTemplatesByCategory(category: Category): Template[] {
  return templates.filter(t => t.category === category);
}

export function getPopularTemplates(): Template[] {
  return templates.filter(t => t.popular);
}

export function searchTemplates(query: string): Template[] {
  const lowercaseQuery = query.toLowerCase();
  return templates.filter(t => 
    t.title.toLowerCase().includes(lowercaseQuery) ||
    t.shortDescription.toLowerCase().includes(lowercaseQuery) ||
    t.category.toLowerCase().includes(lowercaseQuery)
  );
}

export const categoryLabels: Record<Category, string> = {
  defi: 'DeFi',
  payments: 'Payments',
  alerts: 'Alerts',
  portfolio: 'Portfolio'
};

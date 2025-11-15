import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { moonbaseAlpha } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Autometa',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [moonbaseAlpha],
  ssr: true,
});

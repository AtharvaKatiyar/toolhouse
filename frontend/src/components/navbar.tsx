'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto grid h-16 grid-cols-3 items-center">
        {/* Logo - Left */}
        <div className="flex items-center justify-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 p-2">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Auto<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">meta</span>
            </span>
          </Link>
        </div>

        {/* Navigation Links - Center */}
        <nav className="hidden items-center justify-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/explore" className="text-sm font-medium transition-colors hover:text-primary">
            Explore
          </Link>
          <Link href="/workflow/create" className="text-sm font-medium transition-colors hover:text-primary">
            Create
          </Link>
          <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
        </nav>

        {/* Connect Wallet Button - Right */}
        <div className="flex items-center justify-end gap-4">
          <ConnectButton 
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
            chainStatus="icon"
          />
        </div>
      </div>
    </header>
  );
}

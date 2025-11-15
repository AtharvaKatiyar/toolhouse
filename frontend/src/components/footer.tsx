import Link from 'next/link';
import { Zap, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Autometa
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Automate your blockchain workflows with no-code simplicity.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="text-muted-foreground hover:text-foreground">Explore</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">API</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Tutorials</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Examples</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Community</Link></li>
            </ul>
          </div>

          {/* Network */}
          <div>
            <h3 className="font-semibold mb-4">Network</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Moonbase Alpha Testnet</li>
              <li>Chain ID: 1287</li>
              <li className="mt-4">
                <a 
                  href="https://faucet.moonbeam.network/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Get Testnet DEV →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Autometa. Built on Moonbeam.
          </p>
        </div>
      </div>
    </footer>
  );
}

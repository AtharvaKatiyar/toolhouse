'use client';

import { useEffect } from 'react';

/**
 * Suppresses browser extension errors from appearing in the console.
 * 
 * This component filters out harmless errors from browser extensions
 * (MetaMask, etc.) that try to inject JavaScript before being authorized
 * by the browser's security model.
 * 
 * These errors are cosmetic and don't affect functionality.
 */
export function SuppressExtensionErrors() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error to filter extension errors
    console.error = (...args: any[]) => {
      const msg = args[0]?.toString() || '';
      
      // Ignore browser extension errors (MetaMask, WalletConnect, etc.)
      if (
        msg.includes('moz-extension://') ||
        msg.includes('chrome-extension://') ||
        msg.includes('has not been authorized') ||
        msg.includes('Content Security Policy') ||
        msg.includes('source http://localhost')
      ) {
        // Log as debug info instead of error
        console.debug('🦊 Browser extension (ignored):', msg);
        return;
      }
      
      // Pass through real errors
      originalError.apply(console, args);
    };

    // Override console.warn to filter extension warnings
    console.warn = (...args: any[]) => {
      const msg = args[0]?.toString() || '';
      
      if (
        msg.includes('moz-extension://') ||
        msg.includes('chrome-extension://')
      ) {
        return;
      }
      
      originalWarn.apply(console, args);
    };

    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null; // This component doesn't render anything
}

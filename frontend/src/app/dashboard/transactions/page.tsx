'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { moonbaseAlpha } from 'viem/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowDownCircle, ArrowUpCircle, DollarSign, RefreshCw } from 'lucide-react';

const FEE_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_FEE_ESCROW as `0x${string}`;

interface Transaction {
  type: 'deposit' | 'charge' | 'withdrawal';
  blockNumber: number;
  transactionHash: string;
  amount: string;
  amountDEV: number;
  workflowId?: number;
  worker?: string;
  timestamp?: number;
}

export default function TransactionsPage() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [fetchProgress, setFetchProgress] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const publicClient = createPublicClient({
    chain: moonbaseAlpha,
    transport: http(),
  });

  const fetchTransactions = async () => {
    if (!address) return;

    setIsLoading(true);
    setHasError(false);
    setFetchProgress('Fetching latest block...');
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const blocksToFetch = BigInt(1000); // RPC limit is 1024, use 1000 to be safe
      const numChunks = 10; // Fetch 10 chunks = ~10,000 blocks total
      
      const allDepositLogs: any[] = [];
      const allChargeLogs: any[] = [];
      const allWithdrawalLogs: any[] = [];

      // Helper function to retry with exponential backoff
      const fetchWithRetry = async <T,>(
        fetcher: () => Promise<T>,
        description: string,
        maxRetries = 3,
        baseDelay = 1000
      ): Promise<T | null> => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await fetcher();
            if (attempt > 0) {
              console.log(`✅ ${description} succeeded after ${attempt} retry(ies)`);
            }
            return result;
          } catch (error: any) {
            const isNetworkError = error?.message?.includes('NetworkError') || 
                                   error?.message?.includes('fetch') ||
                                   error?.name === 'HttpRequestError';
            
            if (isNetworkError && attempt < maxRetries - 1) {
              const delay = baseDelay * Math.pow(2, attempt);
              console.log(`⚠️ ${description} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            if (attempt === maxRetries - 1) {
              console.error(`❌ ${description} failed after ${maxRetries} attempts:`, error);
            }
            
            throw error;
          }
        }
        return null;
      };

      // Fetch in chunks to avoid "block range too wide" error
      for (let i = 0; i < numChunks; i++) {
        const toBlock = latestBlock - (BigInt(i) * blocksToFetch);
        const fromBlock = toBlock - blocksToFetch + BigInt(1);
        
        if (fromBlock < BigInt(0)) break;

        setFetchProgress(`Fetching chunk ${i + 1}/${numChunks}...`);

        try {
          // Add small delay between chunks to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // Fetch deposits for this chunk with retry
          const deposits = await fetchWithRetry(
            () => publicClient.getLogs({
              address: FEE_ESCROW_ADDRESS,
              event: parseAbiItem('event GasDeposited(address indexed user, uint256 amount)'),
              args: { user: address },
              fromBlock,
              toBlock,
            }),
            `Deposits chunk ${i + 1}`
          );
          if (deposits) allDepositLogs.push(...deposits);

          // Fetch charges for this chunk with retry
          const charges = await fetchWithRetry(
            () => publicClient.getLogs({
              address: FEE_ESCROW_ADDRESS,
              event: parseAbiItem('event GasCharged(address indexed user, uint256 amount, address worker)'),
              args: { user: address },
              fromBlock,
              toBlock,
            }),
            `Charges chunk ${i + 1}`
          );
          if (charges) allChargeLogs.push(...charges);

          // Fetch withdrawals for this chunk with retry
          const withdrawals = await fetchWithRetry(
            () => publicClient.getLogs({
              address: FEE_ESCROW_ADDRESS,
              event: parseAbiItem('event GasWithdrawn(address indexed user, uint256 amount)'),
              args: { user: address },
              fromBlock,
              toBlock,
            }),
            `Withdrawals chunk ${i + 1}`
          );
          if (withdrawals) allWithdrawalLogs.push(...withdrawals);
        } catch (chunkError) {
          console.error(`❌ Chunk ${i + 1} failed completely (blocks ${fromBlock}-${toBlock}):`, chunkError);
          // Continue with other chunks even if one fails after retries
        }
      }

      const depositLogs = allDepositLogs;
      const chargeLogs = allChargeLogs;
      const withdrawalLogs = allWithdrawalLogs;

      // Process deposits
      const deposits: Transaction[] = depositLogs.map((log) => ({
        type: 'deposit',
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        amount: log.args.amount?.toString() || '0',
        amountDEV: Number(log.args.amount || 0) / 1e18,
      }));

      // Process charges
      const charges: Transaction[] = chargeLogs.map((log) => ({
        type: 'charge',
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        amount: log.args.amount?.toString() || '0',
        amountDEV: Number(log.args.amount || 0) / 1e18,
        worker: log.args.worker,
      }));

      // Process withdrawals
      const withdrawals: Transaction[] = withdrawalLogs.map((log) => ({
        type: 'withdrawal',
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        amount: log.args.amount?.toString() || '0',
        amountDEV: Number(log.args.amount || 0) / 1e18,
      }));

      // Combine and sort by block number (most recent first)
      const allTxs = [...deposits, ...charges, ...withdrawals].sort(
        (a, b) => b.blockNumber - a.blockNumber
      );

      setFetchProgress('Fetching block timestamps...');

      // Fetch block timestamps for recent transactions
      const txsWithTimestamps = await Promise.all(
        allTxs.slice(0, 50).map(async (tx) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: BigInt(tx.blockNumber) });
            return { ...tx, timestamp: Number(block.timestamp) };
          } catch {
            return tx;
          }
        })
      );

      setTransactions(txsWithTimestamps);

      setFetchProgress('Fetching current balance...');

      // Fetch current balance
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/escrow/balance/${address}`);
      const data = await response.json();
      setBalance(data.balance_eth || 0);
      
      setFetchProgress('');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setHasError(true);
      setFetchProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions();
    }
  }, [isConnected, address]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'charge':
        return <DollarSign className="h-5 w-5 text-orange-500" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Badge className="bg-green-500">Deposit</Badge>;
      case 'charge':
        return <Badge className="bg-orange-500">Gas Charge</Badge>;
      case 'withdrawal':
        return <Badge className="bg-blue-500">Withdrawal</Badge>;
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Please connect your wallet to view transactions</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-gray-500 mt-2">View all your escrow deposit, charge, and withdrawal transactions</p>
          </div>
          <Button onClick={fetchTransactions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading Progress */}
      {isLoading && fetchProgress && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">{fetchProgress}</p>
                <p className="text-sm text-blue-600">This may take a moment due to network conditions...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {hasError && !isLoading && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div>
              <p className="font-medium text-red-900">Error fetching transactions</p>
              <p className="text-sm text-red-600">
                The RPC endpoint may be experiencing issues. Click Refresh to try again.
                {transactions.length > 0 && ' (Showing previously loaded data)'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Escrow Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">{balance.toFixed(4)} DEV</div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
          <CardDescription>Showing last {transactions.length} transactions from the past ~10,000 blocks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div
                  key={`${tx.transactionHash}-${index}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getTypeIcon(tx.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeBadge(tx.type)}
                          <span className="text-sm text-gray-500">
                            Block #{tx.blockNumber.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Amount:</span>{' '}
                            <span className={`font-semibold ${
                              tx.type === 'deposit' ? 'text-green-600' :
                              tx.type === 'charge' ? 'text-orange-600' :
                              'text-blue-600'
                            }`}>
                              {tx.type === 'deposit' ? '+' : '-'}
                              {tx.amountDEV.toFixed(4)} DEV
                            </span>
                          </div>
                          
                          {tx.timestamp && (
                            <div>
                              <span className="text-gray-500">Time:</span>{' '}
                              <span className="font-mono text-xs">{formatDate(tx.timestamp)}</span>
                            </div>
                          )}
                          
                          {tx.worker && (
                            <div className="md:col-span-2">
                              <span className="text-gray-500">Worker:</span>{' '}
                              <span className="font-mono text-xs">{tx.worker}</span>
                            </div>
                          )}
                          
                          <div className="md:col-span-2">
                            <span className="text-gray-500">Transaction:</span>{' '}
                            <a
                              href={`https://moonbase.moonscan.io/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:underline inline-flex items-center"
                            >
                              {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {transactions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Deposits</div>
                <div className="text-2xl font-bold text-green-600">
                  {transactions
                    .filter(tx => tx.type === 'deposit')
                    .reduce((sum, tx) => sum + tx.amountDEV, 0)
                    .toFixed(4)} DEV
                </div>
                <div className="text-xs text-gray-400">
                  {transactions.filter(tx => tx.type === 'deposit').length} transaction(s)
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Total Charges</div>
                <div className="text-2xl font-bold text-orange-600">
                  {transactions
                    .filter(tx => tx.type === 'charge')
                    .reduce((sum, tx) => sum + tx.amountDEV, 0)
                    .toFixed(4)} DEV
                </div>
                <div className="text-xs text-gray-400">
                  {transactions.filter(tx => tx.type === 'charge').length} transaction(s)
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Total Withdrawals</div>
                <div className="text-2xl font-bold text-blue-600">
                  {transactions
                    .filter(tx => tx.type === 'withdrawal')
                    .reduce((sum, tx) => sum + tx.amountDEV, 0)
                    .toFixed(4)} DEV
                </div>
                <div className="text-xs text-gray-400">
                  {transactions.filter(tx => tx.type === 'withdrawal').length} transaction(s)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

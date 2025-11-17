'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { parseEther, formatEther } from 'viem';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Fuel, AlertCircle, TrendingUp, ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import FeeEscrowArtifact from '@/abi/FeeEscrow.json';

const FEE_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_FEE_ESCROW as `0x${string}`;
const FeeEscrowABI = FeeEscrowArtifact.abi;

export default function EscrowPage() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflow');
  
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [workflowInfo, setWorkflowInfo] = useState<any>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
      
      // If workflow ID provided, fetch workflow info and auto-open deposit modal
      if (workflowId) {
        fetchWorkflowInfo(workflowId);
      }
    } else {
      setLoading(false);
    }
  }, [isConnected, address, workflowId]);

  useEffect(() => {
    if (isSuccess) {
      fetchBalance();
      setDepositAmount('');
      setWithdrawAmount('');
      setShowDepositModal(false);
      setShowWithdrawModal(false);
    }
  }, [isSuccess]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/escrow/balance/${address}`
      );
      setBalance(response.data.balance || '0');
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowInfo = async (id: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${id}`
      );
      if (response.data.success) {
        const workflow = response.data.workflow;
        setWorkflowInfo(workflow);
        
        // Pre-fill deposit amount with workflow's gas budget
        if (workflow.gas_budget_eth) {
          setDepositAmount(workflow.gas_budget_eth.toString());
        }
        
        // Auto-open deposit modal
        setShowDepositModal(true);
      }
    } catch (error) {
      console.error('Error fetching workflow info:', error);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      await writeContract({
        address: FEE_ESCROW_ADDRESS,
        abi: FeeEscrowABI,
        functionName: 'depositGas',
        value: parseEther(depositAmount),
      });
    } catch (error: any) {
      console.error('Error depositing:', error);
      alert(`Failed to deposit: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const balanceNum = parseFloat(balance);
    const withdrawNum = parseFloat(withdrawAmount);

    if (withdrawNum > balanceNum) {
      alert('Insufficient balance');
      return;
    }

    try {
      await writeContract({
        address: FEE_ESCROW_ADDRESS,
        abi: FeeEscrowABI,
        functionName: 'withdrawGas',
        args: [parseEther(withdrawAmount)],
      });
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      alert(`Failed to withdraw: ${error?.message || 'Unknown error'}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to manage gas escrow
          </p>
        </Card>
      </div>
    );
  }

  const balanceNum = parseFloat(balance);
  const isLowBalance = balanceNum < 0.1;
  const recommendedMinimum = 0.5;

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Gas Escrow</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your gas deposits for automated workflows
        </p>
      </div>

      {/* Balance Card */}
      <Card className="mb-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Fuel className="h-8 w-8 text-cyan-500" />
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                {loading ? (
                  <div className="mt-1 h-12 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-4xl font-bold">{balance} DEV</p>
                )}
              </div>
            </div>

            {!loading && isLowBalance && (
              <div className="mt-4 flex items-center gap-2 text-yellow-500">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Low balance! Recommended minimum: {recommendedMinimum} DEV
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowDepositModal(true)} size="lg">
              <ArrowDownCircle className="mr-2 h-5 w-5" />
              Deposit
            </Button>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              variant="outline"
              size="lg"
              disabled={balanceNum === 0}
            >
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Withdraw
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recommended Minimum</p>
              <p className="text-2xl font-bold">{recommendedMinimum} DEV</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 p-3">
              <Fuel className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Gas/Day</p>
              <p className="text-2xl font-bold">0.01 DEV</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 p-3">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="text-2xl font-bold">
                {balanceNum > 0 ? Math.floor(balanceNum / 0.01) : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">About Gas Escrow</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Gas escrow holds funds that pay for automated workflow executions
          </p>
          <p>
            • Deposit funds to ensure your workflows can execute without interruption
          </p>
          <p>
            • Each workflow execution consumes gas based on its configuration
          </p>
          <p>
            • You can withdraw unused funds at any time
          </p>
          <p>
            • Recommended to maintain at least {recommendedMinimum} DEV for active workflows
          </p>
        </div>
      </Card>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-xl font-semibold">Deposit Gas</h3>
            
            {workflowInfo && (
              <div className="mb-4 rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">For Workflow #{workflowInfo.workflow_id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflowInfo.name || 'Automated Workflow'}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount (DEV)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                />
                {workflowInfo && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Workflow gas budget: {workflowInfo.gas_budget_eth} DEV
                  </p>
                )}
              </div>

              {!isConnected && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>Wallet disconnected. Please reconnect.</p>
                </div>
              )}

              {isPending && (
                <div className="flex items-center gap-2 text-sm text-blue-500">
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  <p>Waiting for wallet confirmation...</p>
                </div>
              )}

              {isConfirming && (
                <div className="flex items-center gap-2 text-sm text-yellow-500">
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  <p>Transaction confirming on blockchain...</p>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <p>Deposit successful!</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleDeposit}
                  disabled={isPending || isConfirming || !isConnected}
                  className="flex-1"
                >
                  {isPending ? 'Check Wallet...' : isConfirming ? 'Confirming...' : 'Confirm Deposit'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                    setWorkflowInfo(null);
                  }}
                  disabled={isPending || isConfirming}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-xl font-semibold">Withdraw Gas</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount (DEV)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={balance}
                  placeholder="0.0"
                  value={withdrawAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Available: {balance} DEV
                </p>
              </div>

              {isConfirming && (
                <div className="flex items-center gap-2 text-sm text-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>Transaction pending...</p>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <p>Withdrawal successful!</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleWithdraw}
                  disabled={isPending || isConfirming}
                  className="flex-1"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Confirm Withdrawal'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                  disabled={isPending || isConfirming}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

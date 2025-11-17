'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, type Hex } from 'viem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle, Home } from 'lucide-react';
import { TriggerSelection } from '@/components/wizard/trigger-selection';
import { TriggerConfigForm } from '@/components/wizard/trigger-config-form';
import { ActionSelection } from '@/components/wizard/action-selection';
import { ActionConfigForm } from '@/components/wizard/action-config-form';
import { GasBudgetForm } from '@/components/wizard/gas-budget-form';
import { ReviewStep } from '@/components/wizard/review-step';
import WorkflowRegistryArtifact from '@/abi/WorkflowRegistry.json';
import { encodeTrigger, encodeAction } from '@/lib/encoder';
import { parseWorkflowIdFromLogs } from '@/lib/parseWorkflowId';
import axios from 'axios';

const WORKFLOW_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WORKFLOW_REGISTRY as `0x${string}`;
const WorkflowRegistryABI = WorkflowRegistryArtifact.abi;

export default function CreateWorkflowPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [triggerType, setTriggerType] = useState<'time' | 'price' | 'wallet' | null>(null);
  const [actionType, setActionType] = useState<'native' | 'erc20' | 'contract' | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    gasBudget: '100000',
    maxGasPrice: '1000000000'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [escrowBalance, setEscrowBalance] = useState<number>(0);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Wagmi hooks for blockchain interaction
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const steps = [
    { title: 'Choose Trigger', description: 'When to run' },
    { title: 'Configure Trigger', description: 'Set parameters' },
    { title: 'Choose Action', description: 'What to do' },
    { title: 'Configure Action', description: 'Set parameters' },
    { title: 'Set Gas Budget', description: 'Execution costs' },
    { title: 'Review & Confirm', description: 'Final check' },
    { title: 'Create Workflow', description: 'Submit to chain' }
  ];

  // Handle transaction success - extract workflow ID from receipt
  useEffect(() => {
    const handleTxSuccess = async () => {
      if (isTxSuccess && txHash && publicClient) {
        console.log('[Custom Workflow] Transaction confirmed:', txHash);
        
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
          console.log('[Custom Workflow] Receipt:', receipt);
          
          const wfId = parseWorkflowIdFromLogs(receipt.logs);
          
          if (wfId) {
            console.log(`[Custom Workflow] ✅ Workflow ${wfId} created successfully!`);
            setWorkflowId(wfId);
            setCurrentStep(6); // Move to success step
            setIsSubmitting(false);
          } else {
            console.error('[Custom Workflow] ❌ Could not extract workflow ID');
            setSubmitError('Workflow created but ID could not be extracted');
            setIsSubmitting(false);
          }
        } catch (error) {
          console.error('[Custom Workflow] Error getting receipt:', error);
          setSubmitError('Failed to get transaction receipt');
          setIsSubmitting(false);
        }
      }
    };
    
    handleTxSuccess();
  }, [isTxSuccess, txHash, publicClient]);

  // Check escrow balance when workflow is created
  useEffect(() => {
    if (currentStep === 6 && workflowId && address && !isCheckingBalance) {
      checkEscrowBalance();
    }
  }, [currentStep, workflowId, address]);

  // Check if user has enough gas in escrow
  const checkEscrowBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/escrow/balance/${address}`);
      const balance = parseFloat(response.data.balance || '0');
      setEscrowBalance(balance);
      
      console.log(`[Workflow ${workflowId}] Escrow balance: ${balance} DEV`);
      
      // If balance >= 0.1 DEV (workflow gas budget), auto-activate
      if (balance >= 0.1) {
        console.log(`[Workflow ${workflowId}] Sufficient balance, activating...`);
        await activateWorkflow();
      } else {
        console.log(`[Workflow ${workflowId}] Insufficient balance (need ${(0.1 - balance).toFixed(4)} more DEV)`);
      }
    } catch (error) {
      console.error('Error checking escrow balance:', error);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Activate workflow (backend will handle activation)
  const activateWorkflow = async () => {
    if (!workflowId) return;
    
    setIsActivating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
      console.log(`[Workflow ${workflowId}] Calling activation endpoint...`);
      
      // Use the correct endpoint: PATCH /workflow/{id}/status
      const response = await axios.patch(`${apiUrl}/workflow/${workflowId}/status`, {
        status: 'active'
      });
      
      console.log(`[Workflow ${workflowId}] Activation response:`, response.data);
      
      if (response.data.success) {
        console.log(`[Workflow ${workflowId}] ✅ Successfully activated!`);
      } else {
        console.error(`[Workflow ${workflowId}] ❌ Activation failed:`, response.data);
      }
    } catch (error: any) {
      console.error(`[Workflow ${workflowId}] ❌ Error activating workflow:`, error.response?.data || error.message);
      // Non-critical error - user can still activate manually later
    } finally {
      setIsActivating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1 && triggerType) {
      if (triggerType === 'time') {
        if (!formData.intervalValue || Number(formData.intervalValue) <= 0) {
          newErrors.intervalValue = 'Interval value must be greater than 0';
        }
      } else if (triggerType === 'price') {
        if (!formData.tokenSymbol?.trim()) {
          newErrors.tokenSymbol = 'Token symbol is required';
        }
        if (!formData.priceThreshold || Number(formData.priceThreshold) <= 0) {
          newErrors.priceThreshold = 'Price threshold must be greater than 0';
        }
      } else if (triggerType === 'wallet') {
        if (!formData.walletAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
          newErrors.walletAddress = 'Invalid Ethereum address';
        }
        if (formData.eventType === 'balance' && (!formData.balanceThreshold || Number(formData.balanceThreshold) <= 0)) {
          newErrors.balanceThreshold = 'Balance threshold must be greater than 0';
        }
      }
    }

    if (currentStep === 3 && actionType) {
      if (actionType === 'native') {
        if (!formData.recipientAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
          newErrors.recipientAddress = 'Invalid Ethereum address';
        }
        if (!formData.transferAmount || Number(formData.transferAmount) <= 0) {
          newErrors.transferAmount = 'Amount must be greater than 0';
        }
      } else if (actionType === 'erc20') {
        if (!formData.tokenContract?.match(/^0x[a-fA-F0-9]{40}$/)) {
          newErrors.tokenContract = 'Invalid contract address';
        }
        if (!formData.recipientAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
          newErrors.recipientAddress = 'Invalid Ethereum address';
        }
        if (!formData.transferAmount || Number(formData.transferAmount) <= 0) {
          newErrors.transferAmount = 'Amount must be greater than 0';
        }
      } else if (actionType === 'contract') {
        if (!formData.contractAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
          newErrors.contractAddress = 'Invalid contract address';
        }
        if (!formData.functionSelector?.trim()) {
          newErrors.functionSelector = 'Function selector is required';
        }
        if (formData.contractParams) {
          try {
            JSON.parse(formData.contractParams);
          } catch {
            newErrors.contractParams = 'Parameters must be valid JSON array';
          }
        }
      }
    }

    if (currentStep === 4) {
      if (!formData.gasBudget || Number(formData.gasBudget) < 21000) {
        newErrors.gasBudget = 'Gas budget must be at least 21000';
      }
      if (!formData.maxGasPrice || Number(formData.maxGasPrice) <= 0) {
        newErrors.maxGasPrice = 'Max gas price must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && triggerType) {
      setCurrentStep(1);
    } else if (currentStep === 1 && validateStep()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && actionType) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep()) {
      setCurrentStep(4);
    } else if (currentStep === 4 && validateStep()) {
      setCurrentStep(5);
    } else if (currentStep === 5 && isConnected) {
      setCurrentStep(6);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const buildEncodePayload = () => {
    const payload: any = {};

    // Convert trigger type from string to integer (1=TIME, 2=PRICE, 3=WALLET)
    if (triggerType === 'time') {
      payload.trigger_type = 1;
      // TIME trigger expects: interval_seconds (integer)
      const intervalSeconds = Number(formData.intervalValue) * 
        (formData.intervalType === 'minutes' ? 60 : 
         formData.intervalType === 'hours' ? 3600 : 86400);
      payload.trigger_params = {
        interval_seconds: intervalSeconds
      };
    } else if (triggerType === 'price') {
      payload.trigger_type = 2;
      // PRICE trigger expects: symbol (string), threshold (integer in wei), direction (0=above, 1=below)
      const thresholdWei = Math.floor(parseFloat(formData.priceThreshold || '1.0') * 1e18);
      const direction = formData.operator === 'lt' ? 1 : 0; // lt=below(1), gt=above(0)
      payload.trigger_params = {
        symbol: formData.tokenSymbol || 'GLMR',
        threshold: thresholdWei,
        direction: direction
      };
    } else if (triggerType === 'wallet') {
      payload.trigger_type = 3;
      // WALLET trigger expects: token_address (address), event_type (0=transfer_in, 1=transfer_out)
      const eventTypeMap: Record<string, number> = {
        'balance': 0,
        'transfer_in': 0,
        'transfer_out': 1
      };
      payload.trigger_params = {
        token_address: '0x0000000000000000000000000000000000000000', // Native token
        event_type: eventTypeMap[formData.eventType || 'balance'] || 0
      };
    }

    // Convert action type from string to integer (1=NATIVE, 2=ERC20, 3=CONTRACT)
    if (actionType === 'native') {
      payload.action_type = 1;
      // NATIVE action expects: recipient (address), amount (integer in wei)
      const amountWei = Math.floor(parseFloat(formData.transferAmount || '0') * 1e18);
      payload.action_params = {
        recipient: formData.recipientAddress,
        amount: amountWei
      };
    } else if (actionType === 'erc20') {
      payload.action_type = 2;
      // ERC20 action expects: token_address (address), recipient (address), amount (integer)
      const amountTokens = Math.floor(parseFloat(formData.transferAmount || '0') * 1e18);
      payload.action_params = {
        token_address: formData.tokenContract,
        recipient: formData.recipientAddress,
        amount: amountTokens
      };
    } else if (actionType === 'contract') {
      payload.action_type = 3;
      // CONTRACT action expects: target_address (address), value (integer in wei), calldata (hex string)
      const valueWei = Math.floor(parseFloat(formData.contractValue || '0') * 1e18);
      // Build calldata from function selector and params
      let calldata = formData.functionSelector || '0x';
      if (formData.contractParams) {
        try {
          const params = JSON.parse(formData.contractParams);
          // TODO: Properly encode params based on function signature
          // For now, just use the selector
        } catch (e) {
          console.error('Invalid contract params JSON:', e);
        }
      }
      payload.action_params = {
        target_address: formData.contractAddress,
        value: valueWei,
        calldata: calldata
      };
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setSubmitError('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('[Custom Workflow] 🔐 User will sign workflow creation transaction...');

      // Build workflow parameters
      const payload = buildWorkflowParams();
      
      console.log('[Custom Workflow] Workflow parameters:', payload);
      
      // Encode trigger and action data
      const triggerData = encodeTrigger(payload.trigger_type as 1 | 2 | 3, payload.trigger_params);
      const actionData = encodeAction(payload.action_type as 1 | 2 | 3, payload.action_params);
      
      console.log('[Custom Workflow] Encoded trigger data:', triggerData);
      console.log('[Custom Workflow] Encoded action data:', actionData);

      // User signs the createWorkflow transaction
      console.log('[Custom Workflow] Calling writeContract...');
      await writeContract({
        address: WORKFLOW_REGISTRY_ADDRESS,
        abi: WorkflowRegistryABI,
        functionName: 'createWorkflow',
        args: [
          payload.trigger_type,
          triggerData,
          payload.action_type,
          actionData,
          BigInt(payload.next_run),
          BigInt(payload.interval),
          BigInt(payload.gas_budget)
        ]
      });

      console.log('[Custom Workflow] Transaction submitted, waiting for confirmation...');
      
    } catch (error: any) {
      console.error('[Custom Workflow] ❌ Error creating workflow:', error);
      
      if (error.message?.includes('User rejected') || error.message?.includes('User denied')) {
        setSubmitError('Transaction cancelled by user');
      } else {
        setSubmitError(error.message || 'Failed to create workflow');
      }
      setIsSubmitting(false);
    }
  };

  // Build workflow parameters from form data
  const buildWorkflowParams = () => {
    const payload = buildEncodePayload();
    
    // Add workflow metadata
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = Number(formData.intervalValue) * 
      (formData.intervalType === 'minutes' ? 60 : 
       formData.intervalType === 'hours' ? 3600 : 86400);
    
    // Calculate next_run - execute within 60 seconds for immediate first run
    // Worker will update next_run to now + interval after first execution
    const nextRun = formData.startTime ? 
      Math.floor(new Date(formData.startTime).getTime() / 1000) :
      now + 60; // Execute in 60 seconds, not after full interval
    
    payload.next_run = nextRun;
    payload.interval = intervalSeconds;
    payload.gas_budget = parseInt(formData.gasBudget) || 100000000000000000;
    
    return payload;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12 space-y-4 text-center">
        <h1 className="text-5xl font-bold">
          Create <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Custom Workflow</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Build your automation from scratch with full control over triggers and actions
        </p>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.slice(0, 6).map((step, idx) => (
            <div key={idx} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all
                  ${idx < currentStep ? 'bg-green-500 text-white' : 
                    idx === currentStep ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>
                <div className="mt-2 hidden text-center md:block">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {idx < steps.length - 2 && (
                <div className={`mx-2 h-0.5 flex-1 transition-all ${idx < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="mx-auto max-w-4xl">
        <CardContent className="p-8">
          {currentStep === 0 && (
            <TriggerSelection selectedTrigger={triggerType} onSelect={setTriggerType} />
          )}

          {currentStep === 1 && triggerType && (
            <TriggerConfigForm 
              triggerType={triggerType}
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}

          {currentStep === 2 && (
            <ActionSelection selectedAction={actionType} onSelect={setActionType} />
          )}

          {currentStep === 3 && actionType && (
            <ActionConfigForm 
              actionType={actionType}
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}

          {currentStep === 4 && (
            <GasBudgetForm 
              formData={formData}
              errors={errors}
              onChange={handleInputChange}
            />
          )}

          {currentStep === 5 && triggerType && actionType && (
            <>
              <ReviewStep 
                triggerType={triggerType}
                actionType={actionType}
                formData={formData}
              />
              {!isConnected && (
                <div className="mt-6 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-500">Wallet Not Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Please connect your wallet to create the workflow
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              {workflowId ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                    <h3 className="mt-4 text-2xl font-bold">Workflow Created Successfully!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Workflow ID: <code className="rounded bg-muted px-2 py-1 font-mono">{workflowId}</code>
                    </p>
                  </div>

                  <Separator />

                  {isCheckingBalance ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Checking escrow balance...</p>
                    </div>
                  ) : escrowBalance >= 0.1 ? (
                    // Sufficient balance - workflow activated
                    <div className="space-y-4">
                      <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="text-left">
                            <p className="font-medium text-green-500">Workflow Activated!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your escrow balance ({escrowBalance.toFixed(4)} DEV) is sufficient.
                              {isActivating ? ' Activating workflow...' : ' Workflow is now active and will execute automatically.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold">What happens next:</h3>
                        <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground text-left">
                          <li>Your workflow will execute on schedule automatically</li>
                          <li>Gas fees will be deducted from your escrow balance</li>
                          <li>Monitor executions and balance in your dashboard</li>
                        </ol>
                      </div>

                      <Button className="w-full" onClick={() => router.push(`/dashboard?workflow=${workflowId}&refresh=1`)}>
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    // Insufficient balance - need to deposit
                    <div className="space-y-4">
                      <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div className="text-left">
                            <p className="font-medium text-orange-500">Gas Deposit Required</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Current balance: {escrowBalance.toFixed(4)} DEV<br />
                              Required: 0.1 DEV minimum<br />
                              You need to deposit at least {(0.1 - escrowBalance).toFixed(4)} DEV to activate this workflow.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold">Next Steps:</h3>
                        <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground text-left">
                          <li>Deposit gas fees to the escrow contract</li>
                          <li>Your automation will start running automatically</li>
                          <li>Monitor executions in your dashboard</li>
                        </ol>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => router.push(`/dashboard?workflow=${workflowId}&refresh=1`)}>
                          Go to Dashboard
                        </Button>
                        <Button className="flex-1" onClick={() => router.push(`/escrow/deposit?workflow=${workflowId}`)}>
                          Deposit Gas Fees
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : submitError ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-500">Error Creating Workflow</p>
                        <p className="text-sm text-muted-foreground">{submitError}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setCurrentStep(5)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                      <p className="mt-4 text-lg font-medium">Creating your workflow...</p>
                      <p className="text-sm text-muted-foreground">This may take a few moments</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-8">
                      <p className="text-lg">Ready to create your custom workflow!</p>
                      <p className="text-sm text-muted-foreground">
                        Click the button below to submit to the blockchain.
                      </p>
                      <Button size="lg" onClick={handleSubmit} disabled={!isConnected}>
                        {isConnected ? 'Create Workflow' : 'Connect Wallet First'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep < 6 && (
            <>
              <Separator className="my-8" />
              <div className="flex justify-between">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                <Button 
                  onClick={handleNext}
                  disabled={
                    (currentStep === 0 && !triggerType) ||
                    (currentStep === 2 && !actionType) ||
                    (currentStep === 5 && !isConnected)
                  }
                  className="ml-auto"
                >
                  {currentStep === 5 ? 'Create Workflow' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!workflowId && (
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, type Hex } from 'viem';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { Template } from '@/data/templates';
import axios from 'axios';
import WorkflowRegistryArtifact from '@/abi/WorkflowRegistry.json';
import { encodeTrigger, encodeAction } from '@/lib/encoder';
import { parseWorkflowIdFromLogs } from '@/lib/parseWorkflowId';

const WORKFLOW_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_WORKFLOW_REGISTRY as `0x${string}`;
const WorkflowRegistryABI = WorkflowRegistryArtifact.abi;

interface TemplateSetupWizardProps {
  template: Template;
  onCancel: () => void;
}

export function TemplateSetupWizard({ template, onCancel }: TemplateSetupWizardProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
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
    { title: 'Configure Parameters', description: 'Fill in your automation settings' },
    { title: 'Review & Confirm', description: 'Check your configuration' },
    { title: 'Create Workflow', description: 'Submit to blockchain' },
    { title: 'Deposit Gas', description: 'Fund your automation' }
  ];

  // Handle transaction success - extract workflow ID from receipt
  useEffect(() => {
    const handleTxSuccess = async () => {
      if (isTxSuccess && txHash && publicClient) {
        console.log('[Template Wizard] Transaction confirmed:', txHash);
        
        try {
          // Get transaction receipt
          const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
          console.log('[Template Wizard] Receipt:', receipt);
          
          // Parse workflow ID from logs
          const wfId = parseWorkflowIdFromLogs(receipt.logs);
          
          if (wfId) {
            console.log(`[Template Wizard] ✅ Workflow ${wfId} created successfully!`);
            setWorkflowId(wfId);
            setCurrentStep(3); // Move to gas deposit step
            setIsSubmitting(false);
          } else {
            console.error('[Template Wizard] ❌ Could not extract workflow ID from receipt');
            setSubmitError('Workflow created but ID could not be extracted');
            setIsSubmitting(false);
          }
        } catch (error) {
          console.error('[Template Wizard] Error getting receipt:', error);
          setSubmitError('Failed to get transaction receipt');
          setIsSubmitting(false);
        }
      }
    };
    
    handleTxSuccess();
  }, [isTxSuccess, txHash, publicClient]);

  // Check escrow balance when workflow is created
  useEffect(() => {
    if (currentStep === 3 && workflowId && address && !isCheckingBalance) {
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

  // Navigate to dashboard with proper client-side routing
  const goToDashboard = () => {
    // Use router.push for client-side navigation (preserves wallet connection)
    router.push(`/dashboard?workflow=${workflowId}&refresh=1`);
  };

  // Handle input change
  const handleInputChange = (paramName: string, value: string) => {
    setFormData(prev => ({ ...prev, [paramName]: value }));
    // Clear error for this field
    if (errors[paramName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  // Validate current step
  const validateStep = () => {
    if (currentStep === 0) {
      const newErrors: Record<string, string> = {};
      
      template.parameters.forEach(param => {
        if (param.required && !formData[param.name]?.trim()) {
          newErrors[param.name] = `${param.label} is required`;
        }

        // Type-specific validation
        if (formData[param.name]) {
          const value = formData[param.name];
          
          if (param.type === 'address' && !value.match(/^0x[a-fA-F0-9]{40}$/)) {
            newErrors[param.name] = 'Invalid Ethereum address';
          }
          
          if (param.type === 'amount' && (isNaN(Number(value)) || Number(value) <= 0)) {
            newErrors[param.name] = 'Must be a positive number';
          }
          
          if (param.type === 'price' && (isNaN(Number(value)) || Number(value) <= 0)) {
            newErrors[param.name] = 'Must be a positive number';
          }
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Submit workflow creation - USER SIGNS TRANSACTION
  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setSubmitError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('[Template Wizard] 🔐 User will sign workflow creation transaction...');

      // Build workflow parameters
      const payload = buildWorkflowParams();
      
      console.log('[Template Wizard] Workflow parameters:', payload);
      
      // Encode trigger and action data
      const triggerData = encodeTrigger(payload.trigger_type as 1 | 2 | 3, payload.trigger_params);
      const actionData = encodeAction(payload.action_type as 1 | 2 | 3, payload.action_params);
      
      console.log('[Template Wizard] Encoded trigger data:', triggerData);
      console.log('[Template Wizard] Encoded action data:', actionData);

      // User signs the createWorkflow transaction
      console.log('[Template Wizard] Calling writeContract...');
      await writeContract({
        address: WORKFLOW_REGISTRY_ADDRESS,
        abi: WorkflowRegistryABI,
        functionName: 'createWorkflow',
        args: [
          payload.trigger_type,      // uint8 triggerType
          triggerData,                // bytes triggerData
          payload.action_type,        // uint8 actionType
          actionData,                 // bytes actionData
          BigInt(payload.next_run),   // uint256 nextRun
          BigInt(payload.interval),   // uint256 interval
          BigInt(payload.gas_budget)  // uint256 gasBudget
        ]
      });

      console.log('[Template Wizard] Transaction submitted, waiting for confirmation...');
      // Note: Transaction confirmation is handled by useEffect watching isTxSuccess
      
    } catch (error: any) {
      console.error('[Template Wizard] ❌ Error creating workflow:', error);
      
      // Handle user rejection
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
    const payload: any = {};

    // Calculate timing
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = formData.claimInterval ? 
      parseInt(formData.claimInterval) * 86400 : 
      86400; // Default 1 day

    // Set next_run to NOW so it executes immediately on first run
    // Worker will update it to now + interval after first execution
    payload.next_run = now + 60; // 60 seconds from now to ensure worker picks it up
    payload.interval = intervalSeconds;
    payload.gas_budget = 100000000000000000; // 0.1 DEV in wei

    // Map template type to trigger/action structures
    // Convert trigger type from string to integer (1=TIME, 2=PRICE, 3=WALLET)
    if (template.triggerType === 'time') {
      payload.trigger_type = 1;
      payload.trigger_params = {
        interval_seconds: intervalSeconds
      };
    } else if (template.triggerType === 'price') {
      payload.trigger_type = 2;
      const thresholdWei = Math.floor(parseFloat(formData.thresholdPrice || formData.targetPrice || '1.0') * 1e18);
      payload.trigger_params = {
        symbol: formData.token || 'GLMR',
        threshold: thresholdWei,
        direction: formData.thresholdPrice ? 1 : 0
      };
    } else if (template.triggerType === 'wallet') {
      payload.trigger_type = 3;
      payload.trigger_params = {
        token_address: '0x0000000000000000000000000000000000000000',
        event_type: 0
      };
    }

    // Convert action type from string to integer (1=NATIVE, 2=ERC20, 3=CONTRACT)
    if (template.actionType === 'native') {
      payload.action_type = 1;
      const amountWei = Math.floor(parseFloat(formData.amount || formData.refillAmount || '1.0') * 1e18);
      payload.action_params = {
        recipient: formData.walletAddress || formData.recipientAddress || address,
        amount: amountWei
      };
    } else if (template.actionType === 'erc20') {
      payload.action_type = 2;
      const amountWei = Math.floor(parseFloat(formData.amount || '1.0') * 1e18);
      payload.action_params = {
        token: formData.tokenAddress || '0x0000000000000000000000000000000000000000',
        recipient: formData.walletAddress || formData.recipientAddress || address,
        amount: amountWei
      };
    }

    return payload;
  };

  // Build payload for encode endpoint (DEPRECATED - kept for backwards compatibility)
  const buildEncodePayload = () => {
    const payload: any = {};

    // Map template type to trigger/action structures
    // Convert trigger type from string to integer (1=TIME, 2=PRICE, 3=WALLET)
    if (template.triggerType === 'time') {
      payload.trigger_type = 1;
      // TIME trigger expects: interval_seconds (integer)
      const intervalSeconds = formData.claimInterval ? 
        parseInt(formData.claimInterval) * 86400 : 
        86400; // Default 1 day
      payload.trigger_params = {
        interval_seconds: intervalSeconds
      };
    } else if (template.triggerType === 'price') {
      payload.trigger_type = 2;
      // PRICE trigger expects: symbol (string), threshold (integer in wei), direction (0=above, 1=below)
      const thresholdWei = Math.floor(parseFloat(formData.thresholdPrice || formData.targetPrice || '1.0') * 1e18);
      payload.trigger_params = {
        symbol: formData.token || 'GLMR',
        threshold: thresholdWei,
        direction: formData.thresholdPrice ? 1 : 0  // lt=1 (below), gt=0 (above)
      };
    } else if (template.triggerType === 'wallet') {
      payload.trigger_type = 3;
      // WALLET trigger expects: token_address (address), event_type (0=transfer_in, 1=transfer_out)
      payload.trigger_params = {
        token_address: '0x0000000000000000000000000000000000000000', // Native token
        event_type: 0  // transfer_in
      };
    }

    // Convert action type from string to integer (1=NATIVE, 2=ERC20, 3=CONTRACT)
    if (template.actionType === 'native') {
      payload.action_type = 1;
      // NATIVE action expects: recipient (address), amount (integer in wei)
      const amountWei = Math.floor(parseFloat(formData.amount || formData.refillAmount || '1.0') * 1e18);
      payload.action_params = {
        recipient: formData.recipientAddress || formData.walletAddress || address,
        amount: amountWei
      };
    } else if (template.actionType === 'erc20') {
      payload.action_type = 2;
      // ERC20 action expects: token_address (address), recipient (address), amount (integer)
      const amountTokens = Math.floor(parseFloat(formData.buyAmount || formData.investAmount || '100') * 1e18);
      payload.action_params = {
        token_address: formData.token || '0x0000000000000000000000000000000000000000',
        recipient: formData.recipientAddress || address,
        amount: amountTokens
      };
    } else if (template.actionType === 'contract') {
      payload.action_type = 3;
      // CONTRACT action expects: target_address (address), value (integer in wei), calldata (hex string)
      payload.action_params = {
        target_address: formData.stakingContract || '0x0000000000000000000000000000000000000000',
        value: 0,
        calldata: '0x'  // Empty calldata for now
      };
    }

    return payload;
  };

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Back button */}
      <button 
        onClick={onCancel}
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Cancel Setup
      </button>

      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold
                  ${idx < currentStep ? 'bg-green-500 text-white' : 
                    idx === currentStep ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`mx-4 h-0.5 flex-1 ${idx < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>
            Setting up: {template.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Parameter configuration */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {template.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <label className="text-sm font-medium">
                    {param.label}
                    {param.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {param.description && (
                    <p className="text-xs text-muted-foreground">{param.description}</p>
                  )}
                  <input
                    type="text"
                    placeholder={param.placeholder}
                    value={formData[param.name] || ''}
                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                    className={`
                      w-full rounded-lg border bg-background px-4 py-2 transition-all
                      focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                      ${errors[param.name] ? 'border-red-500' : 'border-border/40'}
                    `}
                  />
                  {errors[param.name] && (
                    <p className="text-xs text-red-500">{errors[param.name]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Review */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
                <h3 className="mb-4 font-semibold">Configuration Summary</h3>
                <div className="space-y-2">
                  {template.parameters
                    .filter(p => formData[p.name])
                    .map((param) => (
                      <div key={param.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{param.label}:</span>
                        <span className="font-medium">{formData[param.name]}</span>
                      </div>
                    ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Automation Details</h3>
                <div className="flex flex-wrap gap-2">
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

              {!isConnected && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-500">Wallet Not Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Please connect your wallet to continue
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Create workflow */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {submitError ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-500">Error Creating Workflow</p>
                      <p className="text-sm text-muted-foreground">{submitError}</p>
                    </div>
                  </div>
                </div>
              ) : isWritePending || isConfirming || isSubmitting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">
                    {isWritePending ? '🔐 Please sign the transaction in your wallet...' :
                     isConfirming ? '⏳ Waiting for blockchain confirmation...' :
                     'Creating your automation...'}
                  </p>
                  <p className="text-sm text-muted-foreground">This may take a few moments</p>
                  {txHash && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      TX: <code className="rounded bg-muted px-1">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-center py-8">
                  <p className="text-lg">Ready to create your automation!</p>
                  <p className="text-sm text-muted-foreground">
                    You will sign a transaction to create the workflow on-chain.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The workflow will be owned by your wallet address.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Gas deposit */}
          {currentStep === 3 && workflowId && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-xl font-bold">Workflow Created Successfully!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Workflow ID: <code className="rounded bg-muted px-2 py-1">{workflowId}</code>
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

                  <Button className="w-full" onClick={goToDashboard}>
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
                    <Button variant="outline" className="flex-1" onClick={goToDashboard}>
                      Go to Dashboard
                    </Button>
                    <Button className="flex-1" asChild>
                      <a href={`/escrow/deposit?workflow=${workflowId}`}>
                        Deposit Gas Fees
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <Separator />
          
          <div className="flex justify-between">
            {currentStep > 0 && currentStep < 3 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            {currentStep === 0 && (
              <Button onClick={handleNext} className="ml-auto">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {currentStep === 1 && (
              <Button 
                onClick={handleNext}
                disabled={!isConnected}
                className="ml-auto"
              >
                Continue to Creation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {currentStep === 2 && !workflowId && (
              <Button 
                onClick={handleSubmit}
                disabled={isWritePending || isConfirming || isSubmitting || !isConnected}
                className="ml-auto"
              >
                {isWritePending || isConfirming || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isWritePending ? 'Sign...' : isConfirming ? 'Confirming...' : 'Creating...'}
                  </>
                ) : (
                  '🔐 Sign & Create Workflow'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

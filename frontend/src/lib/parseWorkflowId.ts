/**
 * Utility to parse workflow ID from WorkflowCreated event in transaction receipt
 */
import { Log } from 'viem';
import WorkflowRegistryArtifact from '@/abi/WorkflowRegistry.json';

const WorkflowRegistryABI = WorkflowRegistryArtifact.abi;

/**
 * Extract workflow ID from WorkflowCreated event logs
 * @param logs - Transaction receipt logs
 * @returns Workflow ID or null if not found
 */
export function parseWorkflowIdFromLogs(logs: Log[]): number | null {
  try {
    // Find the WorkflowCreated event signature
    // event WorkflowCreated(uint256 indexed workflowId, address indexed owner);
    const workflowCreatedEvent = WorkflowRegistryABI.find(
      (item: any) => item.type === 'event' && item.name === 'WorkflowCreated'
    );

    if (!workflowCreatedEvent) {
      console.error('WorkflowCreated event not found in ABI');
      return null;
    }

    // The event has indexed workflowId, so it will be in topics[1]
    // topics[0] = event signature hash
    // topics[1] = workflowId (indexed)
    // topics[2] = owner (indexed)
    
    for (const log of logs) {
      if (log.topics && log.topics.length >= 2) {
        // Parse the workflowId from topics[1] (first indexed parameter)
        const workflowIdHex = log.topics[1];
        if (workflowIdHex) {
          // Convert hex to number
          const workflowId = parseInt(workflowIdHex, 16);
          console.log(`[parseWorkflowId] Found workflow ID: ${workflowId}`);
          return workflowId;
        }
      }
    }

    console.error('[parseWorkflowId] WorkflowCreated event not found in logs');
    return null;
  } catch (error) {
    console.error('[parseWorkflowId] Error parsing workflow ID:', error);
    return null;
  }
}

/**
 * Frontend encoder for workflow trigger and action parameters
 * Matches backend encoder logic
 */
import { encodeAbiParameters, parseAbiParameters, Hex } from 'viem';

/**
 * Encode TIME trigger parameters
 * @param params - { interval_seconds: number }
 */
export function encodeTimeTrigger(params: { interval_seconds: number }): Hex {
  return encodeAbiParameters(
    parseAbiParameters('uint256 intervalSeconds'),
    [BigInt(params.interval_seconds)]
  );
}

/**
 * Encode PRICE trigger parameters
 * @param params - { symbol: string, threshold: number (wei), direction: 0|1 }
 */
export function encodePriceTrigger(params: {
  symbol: string;
  threshold: number;
  direction: number;
}): Hex {
  return encodeAbiParameters(
    parseAbiParameters('string symbol, uint256 threshold, uint8 direction'),
    [params.symbol, BigInt(params.threshold), params.direction]
  );
}

/**
 * Encode WALLET_EVENT trigger parameters
 * @param params - { token_address: address, event_type: 0|1 }
 */
export function encodeWalletTrigger(params: {
  token_address: string;
  event_type: number;
}): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address tokenAddress, uint8 eventType'),
    [params.token_address as `0x${string}`, params.event_type]
  );
}

/**
 * Encode NATIVE transfer action parameters
 * @param params - { recipient: address, amount: number (wei) }
 */
export function encodeNativeAction(params: {
  recipient: string;
  amount: number;
}): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address recipient, uint256 amount'),
    [params.recipient as `0x${string}`, BigInt(params.amount)]
  );
}

/**
 * Encode ERC20 transfer action parameters
 * @param params - { token: address, recipient: address, amount: number (wei) }
 */
export function encodeERC20Action(params: {
  token: string;
  recipient: string;
  amount: number;
}): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address token, address recipient, uint256 amount'),
    [
      params.token as `0x${string}`,
      params.recipient as `0x${string}`,
      BigInt(params.amount),
    ]
  );
}

/**
 * Encode CONTRACT_CALL action parameters
 * @param params - { target: address, calldata: hex, value: number (wei) }
 */
export function encodeContractCallAction(params: {
  target: string;
  calldata: string;
  value: number;
}): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address target, bytes callData, uint256 value'),
    [params.target as `0x${string}`, params.calldata as Hex, BigInt(params.value)]
  );
}

/**
 * Main encoder function - encodes trigger based on type
 */
export function encodeTrigger(
  triggerType: 1 | 2 | 3,
  params: any
): Hex {
  switch (triggerType) {
    case 1: // TIME
      return encodeTimeTrigger(params);
    case 2: // PRICE
      return encodePriceTrigger(params);
    case 3: // WALLET_EVENT
      return encodeWalletTrigger(params);
    default:
      throw new Error(`Invalid trigger type: ${triggerType}`);
  }
}

/**
 * Main encoder function - encodes action based on type
 */
export function encodeAction(
  actionType: 1 | 2 | 3,
  params: any
): Hex {
  let encodedParams: Hex;
  
  switch (actionType) {
    case 1: // NATIVE
      encodedParams = encodeNativeAction(params);
      break;
    case 2: // ERC20
      encodedParams = encodeERC20Action(params);
      break;
    case 3: // CONTRACT_CALL
      encodedParams = encodeContractCallAction(params);
      break;
    default:
      throw new Error(`Invalid action type: ${actionType}`);
  }
  
  // Prepend the actionType byte to the encoded parameters
  // ActionExecutor expects: [actionType(1 byte)] + [encoded parameters]
  const actionTypeByte = actionType.toString(16).padStart(2, '0');
  return `0x${actionTypeByte}${encodedParams.slice(2)}` as Hex;
}

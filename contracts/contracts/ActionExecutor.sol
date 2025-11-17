// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./WorkflowRegistry.sol";
import "./FeeEscrow.sol";

/// @title ActionExecutor
/// @notice Executes workflow actions on behalf of users. Called only by trusted worker.
/// @dev Handles ERC20 transfers, native transfers, contract calls, fees, and nextRun updates.

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ActionExecutor is AccessControl, ReentrancyGuard {
    bytes32 public constant WORKER_ROLE = keccak256("WORKER_ROLE");
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");

    WorkflowRegistry public registry;
    FeeEscrow public escrow;

    event WorkflowExecuted(
        uint256 indexed workflowId,
        address indexed user,
        bool success,
        uint256 gasUsed,
        bytes result
    );

    constructor(address admin, address _registry, address _escrow) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        registry = WorkflowRegistry(_registry);
        escrow = FeeEscrow(_escrow);
    }

    /// ---------------------------------------------------------
    ///  Main execution entry point (called by Python worker)
    /// ---------------------------------------------------------
    function executeWorkflow(
        uint256 workflowId,
        bytes calldata actionData,
        uint256 newNextRun,
        address userToCharge,
        uint256 gasToCharge
    )
        external
        nonReentrant
        onlyRole(WORKER_ROLE)
    {
        // Execute the action FIRST (before charging gas)
        bool success;
        bytes memory result;

        (success, result) = _executeRawAction(actionData);

        // ONLY charge gas if execution was successful
        if (success && gasToCharge > 0) {
            escrow.chargeGas(userToCharge, gasToCharge);
        }

        // Update nextRun inside registry (atomic)
        registry.adminSetWorkflow(workflowId, true, newNextRun);

        emit WorkflowExecuted(
            workflowId,
            userToCharge,
            success,
            gasToCharge,
            result
        );
    }

    /// ---------------------------------------------------------
    ///  Internal executor for different action types
    /// ---------------------------------------------------------
    function _executeRawAction(bytes calldata actionData)
        internal
        returns (bool, bytes memory)
    {
        // First byte = actionType
        uint8 actionType = uint8(actionData[0]);

        if (actionType == 1) {
            return _executeNativeTransfer(actionData[1:]);
        }

        if (actionType == 2) {
            return _executeERC20Transfer(actionData[1:]);
        }

        if (actionType == 3) {
            return _executeContractCall(actionData[1:]);
        }

        revert("Invalid actionType");
    }

    /// ---------------------------------------------------------
    ///  ACTION TYPE 1: Native token transfer
    /// ---------------------------------------------------------
    function _executeNativeTransfer(bytes calldata data)
        internal
        returns (bool, bytes memory)
    {
        (address to, uint256 amount) = abi.decode(data, (address, uint256));

        (bool sent, bytes memory result) = to.call{value: amount}("");

        return (sent, result);
    }

    /// ---------------------------------------------------------
    ///  ACTION TYPE 2: ERC20 transfer
    /// ---------------------------------------------------------
    function _executeERC20Transfer(bytes calldata data)
        internal
        returns (bool, bytes memory)
    {
        (address token, address to, uint256 amount) =
            abi.decode(data, (address, address, uint256));

        bool ok = IERC20(token).transfer(to, amount);
        return (ok, "");
    }

    /// ---------------------------------------------------------
    ///  ACTION TYPE 3: Generic Contract Call
    /// ---------------------------------------------------------
    function _executeContractCall(bytes calldata data)
        internal
        returns (bool, bytes memory)
    {
        (address target, uint256 value, bytes memory callData) =
            abi.decode(data, (address, uint256, bytes));

        (bool success, bytes memory returnData) =
            target.call{value: value}(callData);

        return (success, returnData);
    }

    receive() external payable {}
}

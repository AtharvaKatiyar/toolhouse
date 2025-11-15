// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title WorkflowRegistry
/// @notice Stores user automation workflows. Minimal on-chain storage; heavy logic is off-chain.
/// @dev Uses AccessControl for admin, ReentrancyGuard for safety, and Counters for id generation.

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WorkflowRegistry is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _workflowIdCounter;

    bytes32 public constant PROJECT_ADMIN = keccak256("PROJECT_ADMIN");

    /// @notice Workflow struct - minimal, flexible
    struct Workflow {
        address owner;
        uint8 triggerType;      // 1=time,2=price,3=wallet_event (enum-like)
        bytes triggerData;      // abi-encoded trigger parameters
        uint8 actionType;       // 1=transfer,2=xcm,3=contract_call
        bytes actionData;       // abi-encoded action parameters
        uint256 nextRun;        // next execution timestamp (unix)
        uint256 interval;       // recurrence interval in seconds (0 if not recurring)
        bool active;            // paused / active flag
        uint256 gasBudget;      // optional gas budget (in wei)
    }

    // workflowId => Workflow
    mapping(uint256 => Workflow) private workflows;

    // owner => list of workflowIds
    mapping(address => uint256[]) private ownerWorkflows;
    // workflowId => index in ownerWorkflows[owner] array + 1 (0 means not present)
    mapping(uint256 => uint256) private ownerWorkflowIndex;

    // Events
    event WorkflowCreated(uint256 indexed workflowId, address indexed owner);
    event WorkflowUpdated(uint256 indexed workflowId);
    event WorkflowPaused(uint256 indexed workflowId);
    event WorkflowResumed(uint256 indexed workflowId);
    event WorkflowDeleted(uint256 indexed workflowId);

    // Errors
    error NotOwner();
    error WorkflowNotFound();
    error InvalidWorkflow();

    constructor(address admin) {
        // Grant deployer and provided admin both admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        if (admin != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, admin);
            _grantRole(PROJECT_ADMIN, admin);
        }
    }

    // -----------------------
    // Write functions
    // -----------------------

    /// @notice Create a new workflow
    /// @param triggerType numeric trigger type
    /// @param triggerData ABI-encoded trigger parameters
    /// @param actionType numeric action type
    /// @param actionData ABI-encoded action parameters
    /// @param nextRun next execution timestamp (unix). 0 allowed (worker may compute)
    /// @param interval recurrence interval in seconds (0 if not recurring)
    /// @param gasBudget optional gas budget (in wei)
    /// @return workflowId the ID of the created workflow
    function createWorkflow(
        uint8 triggerType,
        bytes calldata triggerData,
        uint8 actionType,
        bytes calldata actionData,
        uint256 nextRun,
        uint256 interval,
        uint256 gasBudget
    ) external nonReentrant returns (uint256 workflowId) {
        // basic validation (trigger/action types are small ints, further validation off-chain)
        // You can add additional checks here as needed.
        _workflowIdCounter.increment();
        workflowId = _workflowIdCounter.current();

        Workflow memory wf = Workflow({
            owner: msg.sender,
            triggerType: triggerType,
            triggerData: triggerData,
            actionType: actionType,
            actionData: actionData,
            nextRun: nextRun,
            interval: interval,
            active: true,
            gasBudget: gasBudget
        });

        workflows[workflowId] = wf;
        _addOwnerWorkflow(msg.sender, workflowId);

        emit WorkflowCreated(workflowId, msg.sender);
        return workflowId;
    }

    /// @notice Update workflow parameters. Only the owner can call.
    function updateWorkflow(
        uint256 workflowId,
        bytes calldata triggerData,
        bytes calldata actionData,
        uint256 nextRun,
        uint256 interval,
        uint256 gasBudget
    ) external nonReentrant {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        if (wf.owner != msg.sender) revert NotOwner();

        wf.triggerData = triggerData;
        wf.actionData = actionData;
        wf.nextRun = nextRun;
        wf.interval = interval;
        wf.gasBudget = gasBudget;

        emit WorkflowUpdated(workflowId);
    }

    /// @notice Pause a workflow. Only owner.
    function pauseWorkflow(uint256 workflowId) external nonReentrant {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        if (wf.owner != msg.sender) revert NotOwner();

        if (wf.active) {
            wf.active = false;
            emit WorkflowPaused(workflowId);
        }
    }

    /// @notice Resume a paused workflow. Only owner.
    function resumeWorkflow(uint256 workflowId, uint256 newNextRun) external nonReentrant {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        if (wf.owner != msg.sender) revert NotOwner();

        if (!wf.active) {
            wf.active = true;
            // optionally set nextRun when resuming
            if (newNextRun != 0) {
                wf.nextRun = newNextRun;
            }
            emit WorkflowResumed(workflowId);
        }
    }

    /// @notice Delete a workflow permanently. Only owner.
    function deleteWorkflow(uint256 workflowId) external nonReentrant {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        if (wf.owner != msg.sender) revert NotOwner();

        _removeOwnerWorkflow(wf.owner, workflowId);

        // delete storage
        delete workflows[workflowId];

        emit WorkflowDeleted(workflowId);
    }

    // -----------------------
    // Read functions
    // -----------------------

    /// @notice Get full Workflow struct data
    function getWorkflow(uint256 workflowId) external view returns (
        address owner,
        uint8 triggerType,
        bytes memory triggerData,
        uint8 actionType,
        bytes memory actionData,
        uint256 nextRun,
        uint256 interval,
        bool active,
        uint256 gasBudget
    ) {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        return (
            wf.owner,
            wf.triggerType,
            wf.triggerData,
            wf.actionType,
            wf.actionData,
            wf.nextRun,
            wf.interval,
            wf.active,
            wf.gasBudget
        );
    }

    /// @notice Returns list of workflow ids for owner
    function getWorkflowsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerWorkflows[owner];
    }

    /// @notice Total number of workflows created (monotonic)
    function totalWorkflows() external view returns (uint256) {
        return _workflowIdCounter.current();
    }

    /// @notice Get owner and active flag quickly (cheaper than full struct)
    function getWorkflowMeta(uint256 workflowId) external view returns (address owner, bool active, uint256 nextRun) {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        return (wf.owner, wf.active, wf.nextRun);
    }

    // -----------------------
    // Internal helpers
    // -----------------------

    function _addOwnerWorkflow(address owner, uint256 workflowId) internal {
        ownerWorkflows[owner].push(workflowId);
        // store index + 1
        ownerWorkflowIndex[workflowId] = ownerWorkflows[owner].length; // 1-based
    }

    function _removeOwnerWorkflow(address owner, uint256 workflowId) internal {
        uint256 idx1 = ownerWorkflowIndex[workflowId];
        if (idx1 == 0) return; // not present

        uint256 idx = idx1 - 1; // convert to 0-based
        uint256 lastIndex = ownerWorkflows[owner].length - 1;

        if (idx != lastIndex) {
            uint256 lastId = ownerWorkflows[owner][lastIndex];
            ownerWorkflows[owner][idx] = lastId;
            ownerWorkflowIndex[lastId] = idx + 1; // maintain 1-based index
        }

        ownerWorkflows[owner].pop();
        ownerWorkflowIndex[workflowId] = 0;
    }

    // -----------------------
    // Admin utilities
    // -----------------------

    /// @notice Admin can forcibly set a workflow's active flag or nextRun. Use in emergencies.
    function adminSetWorkflow(uint256 workflowId, bool active, uint256 nextRun) external onlyRole(PROJECT_ADMIN) {
        Workflow storage wf = workflows[workflowId];
        if (wf.owner == address(0)) revert WorkflowNotFound();
        wf.active = active;
        wf.nextRun = nextRun;
        emit WorkflowUpdated(workflowId);
    }
}

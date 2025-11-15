// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title FeeEscrow
/// @notice Holds user gas funds so the off-chain worker can pay gas for workflow execution.
/// @dev Only the worker (via WORKER_ROLE) can charge gas from user balances.

contract FeeEscrow is AccessControl, ReentrancyGuard {
    bytes32 public constant WORKER_ROLE = keccak256("WORKER_ROLE");
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");

    /// @notice Tracks balances of users (in native chain token)
    mapping(address => uint256) public balances;

    event GasDeposited(address indexed user, uint256 amount);
    event GasWithdrawn(address indexed user, uint256 amount);
    event GasCharged(address indexed user, uint256 amount, address worker);
    event EmergencyWithdraw(address indexed admin, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /// @notice User deposits gas funds
    function depositGas() external payable nonReentrant {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;
        emit GasDeposited(msg.sender, msg.value);
    }

    /// @notice User withdraws their own unused gas
    function withdrawGas(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Not enough balance");

        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit GasWithdrawn(msg.sender, amount);
    }

    /// @notice Worker charges gas from a user's escrow balance
    /// @dev Callable only by registered worker addresses
    function chargeGas(address user, uint256 amount)
        external
        nonReentrant
        onlyRole(WORKER_ROLE)
    {
        require(balances[user] >= amount, "Insufficient balance");
        balances[user] -= amount;

        // Send to worker for compensation
        payable(msg.sender).transfer(amount);

        emit GasCharged(user, amount, msg.sender);
    }

    /// @notice Emergency withdraw (admin only)
    function emergencyWithdraw(uint256 amount)
        external
        onlyRole(ADMIN_ROLE)
    {
        payable(msg.sender).transfer(amount);
        emit EmergencyWithdraw(msg.sender, amount);
    }
}

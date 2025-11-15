const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ActionExecutor", function () {
  // Fixture for deploying all contracts
  async function deployFullSystemFixture() {
    const [owner, admin, worker, user1, user2] = await ethers.getSigners();

    // Deploy WorkflowRegistry
    const WorkflowRegistry = await ethers.getContractFactory("WorkflowRegistry");
    const registry = await WorkflowRegistry.deploy(admin.address);

    // Deploy FeeEscrow
    const FeeEscrow = await ethers.getContractFactory("FeeEscrow");
    const escrow = await FeeEscrow.deploy(admin.address);

    // Deploy ActionExecutor
    const ActionExecutor = await ethers.getContractFactory("ActionExecutor");
    const executor = await ActionExecutor.deploy(
      admin.address,
      await registry.getAddress(),
      await escrow.getAddress()
    );

    // Grant roles
    const WORKER_ROLE = await executor.WORKER_ROLE();
    await executor.connect(admin).grantRole(WORKER_ROLE, worker.address);
    
    const ESCROW_WORKER_ROLE = await escrow.WORKER_ROLE();
    await escrow.connect(admin).grantRole(ESCROW_WORKER_ROLE, await executor.getAddress());

    const PROJECT_ADMIN = await registry.PROJECT_ADMIN();
    await registry.connect(admin).grantRole(PROJECT_ADMIN, await executor.getAddress());

    return { registry, escrow, executor, owner, admin, worker, user1, user2 };
  }

  // Fixture with a mock ERC20 token
  async function deployWithMockTokenFixture() {
    const fixture = await deployFullSystemFixture();

    // Deploy a simple mock ERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock Token", "MTK");

    return { ...fixture, token };
  }

  describe("Deployment", function () {
    it("Should set the correct contract addresses", async function () {
      const { registry, escrow, executor } = await loadFixture(deployFullSystemFixture);

      expect(await executor.registry()).to.equal(await registry.getAddress());
      expect(await executor.escrow()).to.equal(await escrow.getAddress());
    });

    it("Should set the correct admin roles", async function () {
      const { executor, admin } = await loadFixture(deployFullSystemFixture);

      const DEFAULT_ADMIN_ROLE = await executor.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await executor.ADMIN_ROLE();

      expect(await executor.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await executor.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should have granted WORKER_ROLE to worker", async function () {
      const { executor, worker } = await loadFixture(deployFullSystemFixture);

      const WORKER_ROLE = await executor.WORKER_ROLE();
      expect(await executor.hasRole(WORKER_ROLE, worker.address)).to.be.true;
    });
  });

  describe("Execute Workflow - Native Transfer", function () {
    it("Should execute native token transfer successfully", async function () {
      const { registry, escrow, executor, worker, user1, user2 } = 
        await loadFixture(deployFullSystemFixture);

      // User1 creates a workflow
      const nextRun = await time.latest() + 3600;
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", nextRun, 0, 0);

      // User1 deposits gas
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Fund the executor with native tokens
      await user1.sendTransaction({
        to: await executor.getAddress(),
        value: ethers.parseEther("2.0"),
      });

      // Prepare action data: actionType(1) + abi.encode(to, amount)
      const actionType = 1;
      const transferAmount = ethers.parseEther("0.5");
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user2.address, transferAmount]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      const newNextRun = await time.latest() + 7200;
      const gasCharge = ethers.parseEther("0.01");

      const user2BalanceBefore = await ethers.provider.getBalance(user2.address);

      await expect(
        executor.connect(worker).executeWorkflow(
          1,
          actionData,
          newNextRun,
          user1.address,
          gasCharge
        )
      )
        .to.emit(executor, "WorkflowExecuted")
        .withArgs(1, user1.address, true, gasCharge, "0x");

      const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
      expect(user2BalanceAfter).to.equal(user2BalanceBefore + transferAmount);

      // Check gas was charged
      expect(await escrow.balances(user1.address)).to.equal(
        ethers.parseEther("1.0") - gasCharge
      );
    });

    it("Should revert when non-worker tries to execute", async function () {
      const { executor, user1 } = await loadFixture(deployFullSystemFixture);

      const actionData = "0x01";
      
      await expect(
        executor.connect(user1).executeWorkflow(1, actionData, 0, user1.address, 0)
      ).to.be.reverted;
    });
  });

  describe("Execute Workflow - ERC20 Transfer", function () {
    it("Should execute ERC20 transfer successfully", async function () {
      const { registry, escrow, executor, worker, user1, user2, token } = 
        await loadFixture(deployWithMockTokenFixture);

      // Mint tokens to executor
      const executorAddress = await executor.getAddress();
      const tokenAmount = ethers.parseEther("100");
      await token.mint(executorAddress, tokenAmount);

      // User1 creates a workflow
      await registry.connect(user1).createWorkflow(1, "0x", 2, "0x", 0, 0, 0);

      // User1 deposits gas
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Prepare action data: actionType(2) + abi.encode(token, to, amount)
      const actionType = 2;
      const transferAmount = ethers.parseEther("50");
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256"],
        [await token.getAddress(), user2.address, transferAmount]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      const gasCharge = ethers.parseEther("0.005");

      await executor.connect(worker).executeWorkflow(
        1,
        actionData,
        0,
        user1.address,
        gasCharge
      );

      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });

  describe("Execute Workflow - Contract Call", function () {
    it("Should execute generic contract call", async function () {
      const { registry, escrow, executor, worker, user1, token } = 
        await loadFixture(deployWithMockTokenFixture);

      // User1 creates a workflow
      await registry.connect(user1).createWorkflow(1, "0x", 3, "0x", 0, 0, 0);

      // User1 deposits gas
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Fund executor
      await user1.sendTransaction({
        to: await executor.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      // Prepare contract call to token.name()
      const tokenAddress = await token.getAddress();
      const callData = token.interface.encodeFunctionData("name");

      const actionType = 3;
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes"],
        [tokenAddress, 0, callData]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      await expect(
        executor.connect(worker).executeWorkflow(
          1,
          actionData,
          0,
          user1.address,
          0
        )
      ).to.emit(executor, "WorkflowExecuted");
    });
  });

  describe("Gas Charging", function () {
    it("Should charge gas before execution", async function () {
      const { registry, escrow, executor, worker, user1, user2 } = 
        await loadFixture(deployFullSystemFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Fund executor
      await user1.sendTransaction({
        to: await executor.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const actionType = 1;
      const transferAmount = ethers.parseEther("0.1");
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user2.address, transferAmount]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      const gasCharge = ethers.parseEther("0.05");
      const initialBalance = await escrow.balances(user1.address);

      await executor.connect(worker).executeWorkflow(
        1,
        actionData,
        0,
        user1.address,
        gasCharge
      );

      expect(await escrow.balances(user1.address)).to.equal(
        initialBalance - gasCharge
      );
    });

    it("Should not charge gas when gasToCharge is zero", async function () {
      const { registry, escrow, executor, worker, user1, user2 } = 
        await loadFixture(deployFullSystemFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Fund executor
      await user1.sendTransaction({
        to: await executor.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const actionType = 1;
      const transferAmount = ethers.parseEther("0.1");
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user2.address, transferAmount]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      const initialBalance = await escrow.balances(user1.address);

      await executor.connect(worker).executeWorkflow(
        1,
        actionData,
        0,
        user1.address,
        0 // No gas charge
      );

      expect(await escrow.balances(user1.address)).to.equal(initialBalance);
    });
  });

  describe("Workflow State Update", function () {
    it("Should update workflow nextRun after execution", async function () {
      const { registry, escrow, executor, worker, user1, user2 } = 
        await loadFixture(deployFullSystemFixture);

      const initialNextRun = await time.latest() + 3600;
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", initialNextRun, 0, 0);
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Fund executor
      await user1.sendTransaction({
        to: await executor.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const actionType = 1;
      const transferAmount = ethers.parseEther("0.1");
      const encodedAction = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user2.address, transferAmount]
      );
      const actionData = ethers.solidityPacked(
        ["uint8", "bytes"],
        [actionType, encodedAction]
      );

      const newNextRun = await time.latest() + 7200;

      await executor.connect(worker).executeWorkflow(
        1,
        actionData,
        newNextRun,
        user1.address,
        0
      );

      const workflow = await registry.getWorkflow(1);
      expect(workflow.nextRun).to.equal(newNextRun);
      expect(workflow.active).to.be.true;
    });
  });

  describe("Invalid Action Types", function () {
    it("Should revert on invalid action type", async function () {
      const { registry, escrow, executor, worker, user1 } = 
        await loadFixture(deployFullSystemFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await escrow.connect(user1).depositGas({ value: ethers.parseEther("1.0") });

      // Invalid action type 99
      const actionType = 99;
      const actionData = ethers.solidityPacked(["uint8"], [actionType]);

      await expect(
        executor.connect(worker).executeWorkflow(
          1,
          actionData,
          0,
          user1.address,
          0
        )
      ).to.be.revertedWith("Invalid actionType");
    });
  });

  describe("Receive Function", function () {
    it("Should accept native token transfers", async function () {
      const { executor, user1 } = await loadFixture(deployFullSystemFixture);

      const executorAddress = await executor.getAddress();
      const sendAmount = ethers.parseEther("1.0");

      await expect(
        user1.sendTransaction({
          to: executorAddress,
          value: sendAmount,
        })
      ).to.changeEtherBalance(executor, sendAmount);
    });
  });
});

// Simple Mock ERC20 contract for testing
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

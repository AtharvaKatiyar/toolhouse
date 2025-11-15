const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FeeEscrow", function () {
  // Fixture for deploying the contract
  async function deployFeeEscrowFixture() {
    const [owner, admin, worker, user1, user2] = await ethers.getSigners();

    const FeeEscrow = await ethers.getContractFactory("FeeEscrow");
    const escrow = await FeeEscrow.deploy(admin.address);

    // Grant WORKER_ROLE to worker account
    const WORKER_ROLE = await escrow.WORKER_ROLE();
    await escrow.connect(admin).grantRole(WORKER_ROLE, worker.address);

    return { escrow, owner, admin, worker, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct admin roles", async function () {
      const { escrow, admin } = await loadFixture(deployFeeEscrowFixture);

      const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await escrow.ADMIN_ROLE();

      expect(await escrow.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await escrow.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should start with zero balances", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);
      expect(await escrow.balances(user1.address)).to.equal(0);
    });
  });

  describe("Deposit Gas", function () {
    it("Should allow users to deposit gas", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");

      await expect(
        escrow.connect(user1).depositGas({ value: depositAmount })
      )
        .to.emit(escrow, "GasDeposited")
        .withArgs(user1.address, depositAmount);

      expect(await escrow.balances(user1.address)).to.equal(depositAmount);
    });

    it("Should accumulate multiple deposits", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const deposit1 = ethers.parseEther("0.5");
      const deposit2 = ethers.parseEther("0.3");

      await escrow.connect(user1).depositGas({ value: deposit1 });
      await escrow.connect(user1).depositGas({ value: deposit2 });

      expect(await escrow.balances(user1.address)).to.equal(deposit1 + deposit2);
    });

    it("Should revert on zero deposit", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      await expect(
        escrow.connect(user1).depositGas({ value: 0 })
      ).to.be.revertedWith("Zero deposit");
    });

    it("Should update contract balance", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("2.0");
      const escrowAddress = await escrow.getAddress();

      await escrow.connect(user1).depositGas({ value: depositAmount });

      expect(await ethers.provider.getBalance(escrowAddress)).to.equal(depositAmount);
    });
  });

  describe("Withdraw Gas", function () {
    it("Should allow users to withdraw their gas", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const withdrawAmount = ethers.parseEther("0.4");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(user1).withdrawGas(withdrawAmount)
      )
        .to.emit(escrow, "GasWithdrawn")
        .withArgs(user1.address, withdrawAmount);

      expect(await escrow.balances(user1.address)).to.equal(
        depositAmount - withdrawAmount
      );
    });

    it("Should revert when withdrawing more than balance", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("0.5");
      const withdrawAmount = ethers.parseEther("1.0");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(user1).withdrawGas(withdrawAmount)
      ).to.be.revertedWith("Not enough balance");
    });

    it("Should revert when withdrawing with zero balance", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      await expect(
        escrow.connect(user1).withdrawGas(ethers.parseEther("0.1"))
      ).to.be.revertedWith("Not enough balance");
    });

    it("Should transfer funds back to user", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const withdrawAmount = ethers.parseEther("0.6");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await escrow.connect(user1).withdrawGas(withdrawAmount);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      expect(balanceAfter).to.equal(balanceBefore + withdrawAmount - gasCost);
    });
  });

  describe("Charge Gas", function () {
    it("Should allow worker to charge gas from user balance", async function () {
      const { escrow, worker, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const chargeAmount = ethers.parseEther("0.2");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(worker).chargeGas(user1.address, chargeAmount)
      )
        .to.emit(escrow, "GasCharged")
        .withArgs(user1.address, chargeAmount, worker.address);

      expect(await escrow.balances(user1.address)).to.equal(
        depositAmount - chargeAmount
      );
    });

    it("Should transfer charged amount to worker", async function () {
      const { escrow, worker, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const chargeAmount = ethers.parseEther("0.3");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      const tx = await escrow.connect(worker).chargeGas(user1.address, chargeAmount);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);

      expect(workerBalanceAfter).to.equal(
        workerBalanceBefore + chargeAmount - gasCost
      );
    });

    it("Should revert when non-worker tries to charge gas", async function () {
      const { escrow, user1, user2 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const chargeAmount = ethers.parseEther("0.2");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(user2).chargeGas(user1.address, chargeAmount)
      ).to.be.reverted;
    });

    it("Should revert when charging more than user balance", async function () {
      const { escrow, worker, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("0.5");
      const chargeAmount = ethers.parseEther("1.0");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(worker).chargeGas(user1.address, chargeAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should handle multiple charges from same user", async function () {
      const { escrow, worker, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("1.0");
      const charge1 = ethers.parseEther("0.2");
      const charge2 = ethers.parseEther("0.3");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await escrow.connect(worker).chargeGas(user1.address, charge1);
      await escrow.connect(worker).chargeGas(user1.address, charge2);

      expect(await escrow.balances(user1.address)).to.equal(
        depositAmount - charge1 - charge2
      );
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow admin to emergency withdraw", async function () {
      const { escrow, admin, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("2.0");
      const emergencyAmount = ethers.parseEther("0.5");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      await expect(
        escrow.connect(admin).emergencyWithdraw(emergencyAmount)
      )
        .to.emit(escrow, "EmergencyWithdraw")
        .withArgs(admin.address, emergencyAmount);
    });

    it("Should revert when non-admin tries emergency withdraw", async function () {
      const { escrow, user1 } = await loadFixture(deployFeeEscrowFixture);

      await expect(
        escrow.connect(user1).emergencyWithdraw(ethers.parseEther("0.1"))
      ).to.be.reverted;
    });

    it("Should transfer funds to admin", async function () {
      const { escrow, admin, user1 } = await loadFixture(deployFeeEscrowFixture);

      const depositAmount = ethers.parseEther("2.0");
      const emergencyAmount = ethers.parseEther("1.0");

      await escrow.connect(user1).depositGas({ value: depositAmount });

      const adminBalanceBefore = await ethers.provider.getBalance(admin.address);
      const tx = await escrow.connect(admin).emergencyWithdraw(emergencyAmount);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const adminBalanceAfter = await ethers.provider.getBalance(admin.address);

      expect(adminBalanceAfter).to.equal(
        adminBalanceBefore + emergencyAmount - gasCost
      );
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant WORKER_ROLE", async function () {
      const { escrow, admin, user1 } = await loadFixture(deployFeeEscrowFixture);

      const WORKER_ROLE = await escrow.WORKER_ROLE();

      await escrow.connect(admin).grantRole(WORKER_ROLE, user1.address);

      expect(await escrow.hasRole(WORKER_ROLE, user1.address)).to.be.true;
    });

    it("Should allow admin to revoke WORKER_ROLE", async function () {
      const { escrow, admin, worker } = await loadFixture(deployFeeEscrowFixture);

      const WORKER_ROLE = await escrow.WORKER_ROLE();

      await escrow.connect(admin).revokeRole(WORKER_ROLE, worker.address);

      expect(await escrow.hasRole(WORKER_ROLE, worker.address)).to.be.false;
    });
  });
});

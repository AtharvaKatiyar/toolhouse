const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("WorkflowRegistry", function () {
  // Fixture for deploying the contract
  async function deployWorkflowRegistryFixture() {
    const [owner, admin, user1, user2] = await ethers.getSigners();

    const WorkflowRegistry = await ethers.getContractFactory("WorkflowRegistry");
    const registry = await WorkflowRegistry.deploy(admin.address);

    return { registry, owner, admin, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct admin roles", async function () {
      const { registry, owner, admin } = await loadFixture(deployWorkflowRegistryFixture);

      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      const PROJECT_ADMIN = await registry.PROJECT_ADMIN();

      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await registry.hasRole(PROJECT_ADMIN, admin.address)).to.be.true;
    });

    it("Should start with zero workflows", async function () {
      const { registry } = await loadFixture(deployWorkflowRegistryFixture);
      expect(await registry.totalWorkflows()).to.equal(0);
    });
  });

  describe("Workflow Creation", function () {
    it("Should create a workflow successfully", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      const triggerType = 1; // time-based
      const triggerData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [3600] // 1 hour
      );
      const actionType = 1; // transfer
      const actionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user1.address, ethers.parseEther("1")]
      );
      const nextRun = await time.latest() + 3600;
      const interval = 86400; // 1 day
      const gasBudget = ethers.parseEther("0.1");

      await expect(
        registry.connect(user1).createWorkflow(
          triggerType,
          triggerData,
          actionType,
          actionData,
          nextRun,
          interval,
          gasBudget
        )
      )
        .to.emit(registry, "WorkflowCreated")
        .withArgs(1, user1.address);

      expect(await registry.totalWorkflows()).to.equal(1);
    });

    it("Should return correct workflow data", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      const triggerType = 2;
      const triggerData = "0x1234";
      const actionType = 1;
      const actionData = "0x5678";
      const nextRun = await time.latest() + 3600;
      const interval = 3600;
      const gasBudget = ethers.parseEther("0.05");

      await registry.connect(user1).createWorkflow(
        triggerType,
        triggerData,
        actionType,
        actionData,
        nextRun,
        interval,
        gasBudget
      );

      const workflow = await registry.getWorkflow(1);

      expect(workflow.owner).to.equal(user1.address);
      expect(workflow.triggerType).to.equal(triggerType);
      expect(workflow.triggerData).to.equal(triggerData);
      expect(workflow.actionType).to.equal(actionType);
      expect(workflow.actionData).to.equal(actionData);
      expect(workflow.nextRun).to.equal(nextRun);
      expect(workflow.interval).to.equal(interval);
      expect(workflow.active).to.be.true;
      expect(workflow.gasBudget).to.equal(gasBudget);
    });

    it("Should track workflows by owner", async function () {
      const { registry, user1, user2 } = await loadFixture(deployWorkflowRegistryFixture);

      // User1 creates 2 workflows
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await registry.connect(user1).createWorkflow(2, "0x", 2, "0x", 0, 0, 0);

      // User2 creates 1 workflow
      await registry.connect(user2).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      const user1Workflows = await registry.getWorkflowsByOwner(user1.address);
      const user2Workflows = await registry.getWorkflowsByOwner(user2.address);

      expect(user1Workflows.length).to.equal(2);
      expect(user2Workflows.length).to.equal(1);
      expect(user1Workflows[0]).to.equal(1);
      expect(user1Workflows[1]).to.equal(2);
      expect(user2Workflows[0]).to.equal(3);
    });
  });

  describe("Workflow Updates", function () {
    it("Should update workflow by owner", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x1234", 1, "0x5678", 0, 3600, 0);

      const newTriggerData = "0xabcd";
      const newActionData = "0xef00";
      const newNextRun = await time.latest() + 7200;
      const newInterval = 7200;
      const newGasBudget = ethers.parseEther("0.2");

      await expect(
        registry.connect(user1).updateWorkflow(
          1,
          newTriggerData,
          newActionData,
          newNextRun,
          newInterval,
          newGasBudget
        )
      )
        .to.emit(registry, "WorkflowUpdated")
        .withArgs(1);

      const workflow = await registry.getWorkflow(1);
      expect(workflow.triggerData).to.equal(newTriggerData);
      expect(workflow.actionData).to.equal(newActionData);
      expect(workflow.nextRun).to.equal(newNextRun);
      expect(workflow.interval).to.equal(newInterval);
      expect(workflow.gasBudget).to.equal(newGasBudget);
    });

    it("Should revert when non-owner tries to update", async function () {
      const { registry, user1, user2 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(
        registry.connect(user2).updateWorkflow(1, "0x", "0x", 0, 0, 0)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });

    it("Should revert when updating non-existent workflow", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await expect(
        registry.connect(user1).updateWorkflow(999, "0x", "0x", 0, 0, 0)
      ).to.be.revertedWithCustomError(registry, "WorkflowNotFound");
    });
  });

  describe("Pause and Resume", function () {
    it("Should pause workflow by owner", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(registry.connect(user1).pauseWorkflow(1))
        .to.emit(registry, "WorkflowPaused")
        .withArgs(1);

      const workflow = await registry.getWorkflow(1);
      expect(workflow.active).to.be.false;
    });

    it("Should resume workflow by owner", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await registry.connect(user1).pauseWorkflow(1);

      const newNextRun = await time.latest() + 3600;
      await expect(registry.connect(user1).resumeWorkflow(1, newNextRun))
        .to.emit(registry, "WorkflowResumed")
        .withArgs(1);

      const workflow = await registry.getWorkflow(1);
      expect(workflow.active).to.be.true;
      expect(workflow.nextRun).to.equal(newNextRun);
    });

    it("Should revert when non-owner tries to pause", async function () {
      const { registry, user1, user2 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(
        registry.connect(user2).pauseWorkflow(1)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });
  });

  describe("Workflow Deletion", function () {
    it("Should delete workflow by owner", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(registry.connect(user1).deleteWorkflow(1))
        .to.emit(registry, "WorkflowDeleted")
        .withArgs(1);

      await expect(registry.getWorkflow(1)).to.be.revertedWithCustomError(
        registry,
        "WorkflowNotFound"
      );

      const workflows = await registry.getWorkflowsByOwner(user1.address);
      expect(workflows.length).to.equal(0);
    });

    it("Should properly remove workflow from owner's list", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      // Create 3 workflows
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      // Delete the middle one
      await registry.connect(user1).deleteWorkflow(2);

      const workflows = await registry.getWorkflowsByOwner(user1.address);
      expect(workflows.length).to.equal(2);
      expect(workflows).to.include(1n);
      expect(workflows).to.include(3n);
      expect(workflows).to.not.include(2n);
    });

    it("Should revert when non-owner tries to delete", async function () {
      const { registry, user1, user2 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(
        registry.connect(user2).deleteWorkflow(1)
      ).to.be.revertedWithCustomError(registry, "NotOwner");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to set workflow state", async function () {
      const { registry, admin, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      const newNextRun = await time.latest() + 10000;
      await expect(
        registry.connect(admin).adminSetWorkflow(1, false, newNextRun)
      )
        .to.emit(registry, "WorkflowUpdated")
        .withArgs(1);

      const workflow = await registry.getWorkflow(1);
      expect(workflow.active).to.be.false;
      expect(workflow.nextRun).to.equal(newNextRun);
    });

    it("Should revert when non-admin calls adminSetWorkflow", async function () {
      const { registry, user1, user2 } = await loadFixture(deployWorkflowRegistryFixture);

      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", 0, 0, 0);

      await expect(
        registry.connect(user2).adminSetWorkflow(1, false, 0)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return workflow metadata", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      const nextRun = await time.latest() + 3600;
      await registry.connect(user1).createWorkflow(1, "0x", 1, "0x", nextRun, 0, 0);

      const meta = await registry.getWorkflowMeta(1);
      expect(meta.owner).to.equal(user1.address);
      expect(meta.active).to.be.true;
      expect(meta.nextRun).to.equal(nextRun);
    });

    it("Should return empty array for owner with no workflows", async function () {
      const { registry, user1 } = await loadFixture(deployWorkflowRegistryFixture);

      const workflows = await registry.getWorkflowsByOwner(user1.address);
      expect(workflows.length).to.equal(0);
    });
  });
});

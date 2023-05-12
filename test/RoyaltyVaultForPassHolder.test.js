const { expect, use, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { keccak256 } = ethers.utils;
const {
  addRequestCaseWETH,
  transferWETH,
  transferETH,
  addRequestCaseETH,
} = require("./utils/RoyaltyVaultForPassHolder");
use(require("chai-as-promised"));

let royaltyVault;
let signer_address;
let weth;
let list_account = [];
let holderlist = [];
const AMOUNT_WETH_TRANFER = "0.001";
let AMOUNT_ETH_TRANFER = "0.002";
const TOKEN_ID = 0;
let signer;
let royaltyVaultAddress;
let list_signer_holderlist;
let teamWalletAccount;

describe("RoyaltyVaultForPassHolder", () => {
  beforeEach(async () => {
    const [deployer, ...accounts] = await hre.ethers.getSigners();
    signer = deployer;
    signer_address = deployer.address;
    list_account = accounts.slice(0, 7).map((account) => account.address);
    holderlist = list_account.slice(0, 4);
    list_signer_holderlist = accounts.slice(0, 4);
    teamWalletAccount = accounts[4];
    const RoyaltyVaultForPassHolder = await hre.ethers.getContractFactory("RoyaltyVaultForPassHolder");
    const WETH = await hre.ethers.getContractFactory("WETH");

    weth = await WETH.deploy("weth", "WETH", ethers.utils.parseEther("2.0"));
    await weth.deployed();

    royaltyVault = await RoyaltyVaultForPassHolder.deploy(weth.address, signer_address);
    royaltyVaultAddress = royaltyVault.address;
    await royaltyVault.deployed();

    const tx = await royaltyVault.setWETH(weth.address);
    await tx.wait();
  });

  it("should add request case WETH", async () => {
    await transferWETH(weth, royaltyVaultAddress, AMOUNT_WETH_TRANFER);
    const amountWei = ethers.utils.parseEther(AMOUNT_WETH_TRANFER);
    const { requestId } = await addRequestCaseWETH(
      amountWei,
      TOKEN_ID,
      royaltyVault,
      holderlist
    );
    for (let holder of holderlist) {
      const claimablePerAccount = (
        await royaltyVault.claimablePerAccount(holder)
      ).amountWETH;

      expect(claimablePerAccount.toString()).to.be.eq(
        ethers.utils
          .parseEther(AMOUNT_WETH_TRANFER)
          .div(holderlist.length)
          .toString()
      );
    }
    expect(requestId).to.be.eq("1");
  });

  it("should withdraw WETH", async () => {
    await transferWETH(weth, royaltyVaultAddress, AMOUNT_WETH_TRANFER);
    const amountWei = ethers.utils.parseEther(AMOUNT_WETH_TRANFER);
    await addRequestCaseWETH(amountWei, TOKEN_ID, royaltyVault, holderlist);
    // withdraw above
    // get claimable, balance before
    let balanceBefore = [];
    for (let i = 0; i < holderlist.length; i++) {
      const balance = await weth.balanceOf(holderlist[i]);
      balanceBefore.push(balance);
    }

    for (let i = 0; i < holderlist.length; i++) {
      const claimable = (await royaltyVault.claimablePerAccount(holderlist[i]))
        .amountWETH;
      const wd = await royaltyVault.connect(list_signer_holderlist[i]).withdraw();
      await wd.wait();
    }

    for (let i = 0; i < holderlist.length; i++) {
      const claimable = (await royaltyVault.claimablePerAccount(holderlist[i]))
        .amountWETH;
      const withdrawn = (await royaltyVault.withdrawnPerAccount(holderlist[i]))
        .amountWETH;
      const balance = await weth.balanceOf(holderlist[i]);
      expect(claimable.toString()).to.be.eq("0");
      expect(
        withdrawn.eq(
          new BigNumber.from(ethers.utils.parseEther(AMOUNT_WETH_TRANFER)).div(
            holderlist.length
          )
        )
      ).to.be.eq(true);
      expect(
        balance.eq(
          balanceBefore[i].add(
            new BigNumber.from(
              ethers.utils.parseEther(AMOUNT_WETH_TRANFER)
            ).div(holderlist.length)
          )
        )
      ).to.be.eq(true);
    }
  });

  it("should add request case ETH", async () => {
    const amountETHWei = ethers.utils.parseEther(AMOUNT_ETH_TRANFER);
    const { requestId } = await addRequestCaseETH(amountETHWei, TOKEN_ID, royaltyVault, holderlist);

    for (let holder of holderlist) {
      const claimablePerAccount = (
        await royaltyVault.claimablePerAccount(holder)
      ).amountETH;

      expect(claimablePerAccount.toString()).to.be.eq(
        ethers.utils
          .parseEther(AMOUNT_ETH_TRANFER)
          .div(holderlist.length)
          .toString()
      );
    }
    expect(requestId.toString()).to.be.eq("1");
  });
  it("should withdraw ETH", async () => {
    const { receiveETHId } = await transferETH(
      signer,
      royaltyVaultAddress,
      AMOUNT_ETH_TRANFER
    );
    const amountETHWei = ethers.utils.parseEther(AMOUNT_ETH_TRANFER);
    const { requestId } = await addRequestCaseETH(amountETHWei, TOKEN_ID, royaltyVault, holderlist);
    let balanceBefore = [];
    for (let i = 0; i < holderlist.length; i++) {
      const balance = await list_signer_holderlist[i].getBalance();
      balanceBefore.push(balance);
    }

    for (let i = 0; i < holderlist.length; i++) {
      const wd = await royaltyVault.connect(list_signer_holderlist[i]).withdraw();
      await wd.wait();
    }

    for (let i = 0; i < holderlist.length; i++) {
      const claimable = (await royaltyVault.claimablePerAccount(holderlist[i]))
        .amountETH;
      const withdrawn = (await royaltyVault.withdrawnPerAccount(holderlist[i]))
        .amountETH;
      const balance = await list_signer_holderlist[i].getBalance();
      expect(claimable.toString()).to.be.eq("0");
      expect(
        withdrawn.eq(
          new BigNumber.from(ethers.utils.parseEther(AMOUNT_ETH_TRANFER)).div(
            holderlist.length
          )
        )
      );
      // balance < balanceBefore + withdrawn, signer spent small amount for the gas cost.
      expect(
        balance.lt(
          balanceBefore[i].add(
            new BigNumber.from(
              ethers.utils.parseEther(AMOUNT_ETH_TRANFER)
            ).div(holderlist.length)
          )
        )
      ).to.be.eq(true);
    }
  });
  it("should batchWithdraw by withdrawerRole", async () => {
    await transferWETH(weth, royaltyVaultAddress, AMOUNT_WETH_TRANFER);
    const amountWei = ethers.utils.parseEther(AMOUNT_WETH_TRANFER);
    await addRequestCaseWETH(amountWei, TOKEN_ID, royaltyVault, holderlist);

    const { receiveETHId } = await transferETH(
      signer,
      royaltyVaultAddress,
      AMOUNT_ETH_TRANFER
    );
    const amountETHWei = ethers.utils.parseEther(AMOUNT_ETH_TRANFER);
    await addRequestCaseETH(amountETHWei, TOKEN_ID, royaltyVault, holderlist);

    let claimableWETHBefore = [];
    let claimableETHBefore = [];
    let balanceWETHBefore = [];
    let balanceETHBefore = [];

    for (let i = 0; i < holderlist.length; i++) {
      const claimableWETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountWETH;
      const claimableETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountETH;
      const balanceETH = await list_signer_holderlist[i].getBalance();
      const balanceWETH = await weth.balanceOf(holderlist[i]);
      claimableWETHBefore.push(claimableWETH);
      claimableETHBefore.push(claimableETH);
      balanceWETHBefore.push(balanceWETH);
      balanceETHBefore.push(balanceETH);
    }

    const wd = await royaltyVault.batchWithdraw(holderlist);
    await wd.wait();

    for (let i = 0; i < holderlist.length; i++) {
      const claimableWETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountWETH;
      const claimableETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountETH;
      const balanceETH = await list_signer_holderlist[i].getBalance();
      const balanceWETH = await weth.balanceOf(holderlist[i]);
      expect(claimableWETH.toString()).to.be.eq("0");
      expect(claimableETH.toString()).to.be.eq("0");

      expect(
        balanceETH.eq(balanceETHBefore[i].add(claimableETHBefore[i]))
      ).to.be.eq(true);
      expect(
        balanceWETH.eq(balanceWETHBefore[i].add(claimableWETHBefore[i]))
      ).to.be.eq(true);
    }
  });

  it("should sweep by withdrawer_role", async () => {
    await transferWETH(weth, royaltyVaultAddress, AMOUNT_WETH_TRANFER);
    const amountWei = ethers.utils.parseEther(AMOUNT_WETH_TRANFER);
    await addRequestCaseWETH(amountWei, TOKEN_ID, royaltyVault, holderlist);

    const { requestId } = await transferETH(
      signer,
      royaltyVaultAddress,
      AMOUNT_ETH_TRANFER
    );
    const amountETHWei = ethers.utils.parseEther(AMOUNT_ETH_TRANFER);
    await addRequestCaseETH(amountETHWei, TOKEN_ID, royaltyVault, holderlist);

    let claimableWETHBefore = [];
    let claimableETHBefore = [];
    let balanceWETHBefore = [];
    let balanceETHBefore = [];

    for (let i = 0; i < holderlist.length; i++) {
      const claimableWETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountWETH;
      const claimableETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountETH;
      const balanceETH = await list_signer_holderlist[i].getBalance();
      const balanceWETH = await weth.balanceOf(holderlist[i]);
      claimableWETHBefore.push(claimableWETH);
      claimableETHBefore.push(claimableETH);
      balanceWETHBefore.push(balanceWETH);
      balanceETHBefore.push(balanceETH);
    }

    const teamWallet = list_account[4];
    const setWallet = await royaltyVault.setTeamWallet(teamWallet);
    await setWallet.wait();

    // sweep function doesn't have `whenPaused` guard.
    const sweep = await royaltyVault.sweep(holderlist);
    await sweep.wait();

    for (let i = 0; i < holderlist.length; i++) {
      const claimableWETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountWETH;
      const claimableETH = (
        await royaltyVault.claimablePerAccount(holderlist[i])
      ).amountETH;
      const balanceETH = await list_signer_holderlist[i].getBalance();
      const balanceWETH = await weth.balanceOf(holderlist[i]);
      expect(claimableWETH.toString()).to.be.eq("0");
      expect(claimableETH.toString()).to.be.eq("0");
    }
    const sumOfClaimableETH = claimableETHBefore.reduce((partialSum, claimableETH) => partialSum + claimableETH, 0)
    const sumOfClaimableWETH = claimableWETHBefore.reduce((partialSum, claimableWETH) => partialSum + claimableWETH, 0)
    expect(teamWalletAccount.getBalance(), sumOfClaimableETH);
    expect((await weth.balanceOf(teamWallet)), sumOfClaimableWETH);
  });
});

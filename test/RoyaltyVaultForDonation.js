const { expect, use, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { keccak256 } = ethers.utils;
const {
  transferWETH,
  addRequestCaseWETH,
  transferETH,
  addRequestCaseETH,
  getMaterialIdByTokenId
} = require("./utils/RoyaltyVaultForDonation");
use(require("chai-as-promised"));

let royaltyVaultForDonation;
let signer_address;
let weth;
let list_account = [];
const AMOUNT_WETH_TRANSFER = "0.001";
let AMOUNT_ETH_TRANSFER = "0.001";
const TOKEN_ID = 0;
let signer;
let royaltyVaultAddress;
let list_account_signer;
let withdrawer;

describe("RoyaltyVaultForDonation", () => {
  beforeEach(async () => {
    const [deployer, ...accounts] = await hre.ethers.getSigners();
    signer = deployer;
    signer_address = deployer.address;
    withdrawer = accounts[4];
    list_account = accounts.slice(1, 8).map((account) => account.address);
    list_account_signer = accounts.slice(1, 8);
    const RoyaltyVaultForDonation = await hre.ethers.getContractFactory(
      "RoyaltyVaultForDonation"
    );
    const WETH = await hre.ethers.getContractFactory("WETH");

    weth = await WETH.deploy("weth", "WETH", ethers.utils.parseEther("2.0"));
    await weth.deployed();

    royaltyVaultForDonation = await RoyaltyVaultForDonation.deploy(
      weth.address,
      withdrawer.address
    );
    royaltyVaultAddress = royaltyVaultForDonation.address;
    await royaltyVaultForDonation.deployed();
  });

  it("should add request case WETH", async () => {
    const materialId = getMaterialIdByTokenId(TOKEN_ID);
    // Register 7 withdrawer addresses
    const txhash = await royaltyVaultForDonation.setWithdrawerForMaterialId(
      materialId, list_account[materialId]
    );
    await txhash.wait();

    const amountDonation = await transferWETH(
      weth,
      royaltyVaultAddress,
      AMOUNT_WETH_TRANSFER
    );
    const receiveAmount = await addRequestCaseWETH(
      materialId,
      amountDonation,
      false,
      royaltyVaultForDonation
    );
    const claimablePerMaterial =
      await royaltyVaultForDonation.claimablePerMaterial(materialId);
    expect(claimablePerMaterial.amountWETH.toString()).to.be.eq(
      receiveAmount.toString()
    );
  });

  it("should add request case ETH", async () => {
    const materialId = getMaterialIdByTokenId(TOKEN_ID);
    // Register 7 withdrawer addresses
    const txhash = await royaltyVaultForDonation.setWithdrawerForMaterialId(
      materialId, list_account[materialId]
    );
    await txhash.wait();

    // Send ETH
    const amountDonation = await transferETH(
      signer,
      royaltyVaultAddress,
      AMOUNT_ETH_TRANSFER
    );
    const receiveAmount = await addRequestCaseETH(
      materialId,
      amountDonation,
      true,
      royaltyVaultForDonation
    );
    const claimablePerMaterial =
      await royaltyVaultForDonation.claimablePerMaterial(materialId);
    expect(claimablePerMaterial.amountETH.toString()).to.be.eq(
      receiveAmount.toString()
    );
  });

  it("should withdraw WETH", async () => {
    const materialId = 3;
    // Register 7 withdrawer addresses
    const txhash = await royaltyVaultForDonation.setWithdrawerForMaterialId(
      materialId, list_account[materialId]
    );
    await txhash.wait();

    const amountDonation = await transferWETH(
      weth,
      royaltyVaultAddress,
      AMOUNT_WETH_TRANSFER
    );
    await addRequestCaseWETH(
      materialId,
      amountDonation,
      true,
      royaltyVaultForDonation
    );
    const balanceBefore = await weth.balanceOf(signer_address);

    const setup = await royaltyVaultForDonation.setWithdrawerForMaterialId(
      materialId, list_account[materialId]
    );
    await setup.wait();
    const claimablePerMaterial =
      await royaltyVaultForDonation.claimablePerMaterial(materialId);
    amountWETH = claimablePerMaterial.amountWETH;

    const wd = await royaltyVaultForDonation
      .connect(withdrawer)
      .withdraw(materialId, true, signer_address, amountWETH);
    await wd.wait();

    const claimable = (
      await royaltyVaultForDonation.claimablePerMaterial(materialId)
    ).amountWETH;
    const withdrawn = (
      await royaltyVaultForDonation.withdrawnPerMaterial(materialId)
    ).amountWETH;
    const balance = await weth.balanceOf(signer_address);
    expect(claimable.toString()).to.be.eq("0");
    expect(withdrawn.eq(new BigNumber.from(amountWETH))).to.be.eq(true);
    expect(
      balance.eq(balanceBefore.add(new BigNumber.from(amountWETH)))
    ).to.be.eq(true);
  });

  it("should withdraw ETH", async () => {
    const materialId = 3;
    const txhash = await royaltyVaultForDonation.setWithdrawerForMaterialId(
      materialId, list_account[materialId]
    );
    await txhash.wait();

    const amountDonation = await transferETH(
      signer,
      royaltyVaultAddress,
      AMOUNT_ETH_TRANSFER
    );
    await addRequestCaseETH(
      materialId,
      amountDonation,
      false,
      royaltyVaultForDonation
    );

    const balanceBefore = await signer.getBalance();

    const claimablePerMaterial =
      await royaltyVaultForDonation.claimablePerMaterial(materialId);
    amountETH = claimablePerMaterial.amountETH;

    const wd = await royaltyVaultForDonation
      .connect(withdrawer)
      .withdraw(materialId, false, signer_address, amountETH);
    await wd.wait();

    const claimable = (
      await royaltyVaultForDonation.claimablePerMaterial(materialId)
    ).amountETH;
    const withdrawn = (
      await royaltyVaultForDonation.withdrawnPerMaterial(materialId)
    ).amountETH;
    const balance = await signer.getBalance();
    expect(claimable.toString()).to.be.eq("0");
    expect(withdrawn.eq(new BigNumber.from(amountETH))).to.be.eq(true);
    expect(
      balance.eq(balanceBefore.add(new BigNumber.from(amountETH)))
    ).to.be.eq(true);
  });
});

const RoyaltyVaultForDonationAbi = require("../../abi/royaltyVaultForDonationABI.json");
const { ethers, utils } = require("ethers");
const ERC20ABI = require("../../abi/ERC20ABI.json");
const materialIdList = require('../../__file/materialIdList.json');

const getMaterialIdByTokenId = (tokenId) => materialIdList[tokenId];
const getLogs = (abi, logs) => {
  const iface = new ethers.utils.Interface(abi);
  let events = logs.map((log) => {
    try {
      return iface.parseLog(log);
    } catch (e) {
      return {};
    }
  });
  return events;
};

const getLogsSendETH = (logs) => {
  return getLogs(RoyaltyVaultForDonationAbi.abi, logs);
};

const getLogsSendWETH = (logs) => {
  return getLogs(ERC20ABI, logs);
};

const insertRequestToDonation = async (
  materialId,
  amountWETH,
  isWETH,
  royaltyVaultForDonation
) => {
  try {
    const tx = await royaltyVaultForDonation.addRequest(
      materialId,
      amountWETH.amountDonation,
      isWETH,
      {
        gasLimit: "4000000",
      }
    );
    await tx.wait();
    const claimableAmount = await royaltyVaultForDonation.claimablePerMaterial(
      materialId
    );
    return claimableAmount;
  } catch (e) {
    console.log("Error - insertRequestToDonation", e);
  }
};

async function addRequestCaseWETH(
  materialId,
  amountWETH,
  isWETH,
  royaltyVaultForDonation
) {
  const claimableAmount = await insertRequestToDonation(
    materialId,
    amountWETH,
    isWETH,
    royaltyVaultForDonation
  );
  return claimableAmount.amountWETH;
}

async function addRequestCaseETH(
  materialId,
  amountETH,
  isWETH,
  royaltyVaultForDonation
) {
  const claimableAmount = await insertRequestToDonation(
    materialId,
    amountETH,
    isWETH,
    royaltyVaultForDonation
  );
  return claimableAmount.amountETH;
}

async function transferETH(signer, revenueShareAddress, amount) {
  let amountDonation;
  const tx = await signer.sendTransaction({
    to: revenueShareAddress,
    value: ethers.utils.parseEther(amount),
  });
  const response = await tx.wait();
  const events = getLogsSendETH(response.logs);
  events.forEach((ev1) => {
    if (ev1.name === "ReceivedETH") {
      amountDonation = ev1.args.amount.toString();
    }
  });
  return { amountDonation };
}

async function transferWETH(wethContract, revenueShareAddress, amount) {
  let amountDonation;
  const transfer = await wethContract.transfer(
    revenueShareAddress,
    ethers.utils.parseEther(amount)
  );
  const response = await transfer.wait();
  const events = getLogsSendWETH(response.logs);
  events.forEach((ev1) => {
    if (ev1.name === "Transfer") {
      amountDonation = ev1.args[2].toString();
    }
  });
  return { amountDonation };
}

function randomMaterialId() {
  return Math.floor(Math.random() * 7);
}

module.exports = {
  insertRequestToDonation,
  getLogsSendETH,
  addRequestCaseWETH,
  addRequestCaseETH,
  transferETH,
  transferWETH,
  randomMaterialId,
  getMaterialIdByTokenId,
};

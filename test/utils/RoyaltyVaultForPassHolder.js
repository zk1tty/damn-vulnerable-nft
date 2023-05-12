const RevenueShareAbi = require("../../abi/royaltyVaultForPassHolderABI.json");
const { ethers, utils } = require("ethers");

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
  // return events;
};
const getLogsSendETH = (logs) => {
  return getLogs(RevenueShareAbi.abi, logs);
};

const insertRequest = async (_amount, isWETH, tokenId, royaltyVaultForPassHolder, holderList) => {
  try {
    const tx = await royaltyVaultForPassHolder.addRequest(_amount, isWETH, tokenId, holderList, {
      gasLimit: "4000000",
    });
    await tx.wait();
    const requestId = (await royaltyVaultForPassHolder.requestId()).toString();
    return requestId;
  } catch (e) {
    console.log("Error - insertRequestToPassHolder", e);
  }
};

async function addRequestCaseWETH(amount, TOKEN_ID, royaltyVaultForPassHolder, holderlist) {
  const requestId = await insertRequest(
    amount,
    true,
    TOKEN_ID,
    royaltyVaultForPassHolder,
    holderlist
  );
  return { requestId };
}

async function addRequestCaseETH(
  amount,
  TOKEN_ID,
  royaltyVaultForPassHolder,
  holderlist
) {
    const requestId = await insertRequest(
    amount,
    false,
    TOKEN_ID,
    royaltyVaultForPassHolder,
    holderlist
  );
  return { requestId };
}

async function transferETH(signer, royaltyVaultForPassHolderAddress, amount) {
  const tx = await signer.sendTransaction({
    to: royaltyVaultForPassHolderAddress,
    value: ethers.utils.parseEther(amount),
  });
  const response = await tx.wait();
  const events = getLogsSendETH(response.logs);
  return { receivedId: events[0].args[0] };
}

async function transferWETH(wethContract, royaltyVaultForPassHolderAddress, amount) {
  const transfer = await wethContract.transfer(
    royaltyVaultForPassHolderAddress,
    ethers.utils.parseEther(amount)
  );
  await transfer.wait();
}
module.exports = {
  insertRequest,
  getLogsSendETH,
  addRequestCaseWETH,
  transferWETH,
  transferETH,
  addRequestCaseETH
};

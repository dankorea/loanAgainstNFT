

import { getTokenContract } from "./contract.mjs";

const brownie_config = await inputJsonFile("../conf/brownie-config.json");
const helper_config = await inputJsonFile("../conf/helper-config.json");
const chainId = await web3.eth.net.getId();
const networkMapping = await inputJsonFile("../conf/map.json");
// // 1. LOANT as loan token
// const tokenAddress = networkMapping[chainId]["LoanToken"][0];
// 2. WETH as loan token
const networkName = helper_config[chainId];
const tokenAddress = brownie_config["networks"][networkName]["loan_token"];
const tokenJson = await inputJsonFile("../contracts/MockLoanToken.json");
const tokenContract = new web3.eth.Contract(tokenJson.abi, tokenAddress);

// const nftAddress = networkMapping[chainId]["SimpleNFT"][0];
// const nftAddress = "0x3a1e7aba44bf21a66344d7a0f795a7df0b49ed60"; // the XENFT
const nftAddress = "0x06c586b4a9f95d6480cf6ab66ae16c3a391d7f02"; // many doggies
const nftJson = await inputJsonFile("../contracts/SimpleNFT.json");
const nftContract = new web3.eth.Contract(nftJson.abi, nftAddress);
const nftId = "2"; //30930";
const escrowAddress = networkMapping[chainId]["Escrow"][0];
const escrowJson = await inputJsonFile("../contracts/Escrow.json");
const escrowContract = new web3.eth.Contract(escrowJson.abi, escrowAddress);

async function getNftBalance(user) {
  const nftContract = await getTokenContract(nftJson, nftAddress);
  return await nftContract.methods.balanceOf(user).call();
}
async function getTokenBalance(user) {
  const tokenContract = await getTokenContract(tokenJson, tokenAddress);
  return await tokenContract.methods.balanceOf(user).call();
}

async function checkNftApprove() {
  // const tokenContract = await getTokenContract();
  // tokenContract.methods.allowance.call();
}

async function getNftUri(nftId) {
  const nftContract = await getTokenContract(nftJson, nftAddress);

  return await nftContract.methods.tokenURI(nftId).call(); //???
}


async function checkClicked() {

  const loanInfo = await showOffers(nftAddress, nftId);
  console.log(loanInfo.loanAmount);
  console.log(loanInfo.loanPeriod);
  console.log(loanInfo.loanInterest);
  document.getElementById("loanAmount").value = loanInfo.loanAmount;
  document.getElementById("loanPeriod").value = loanInfo.loanPeriod;
  document.getElementById("loanInterest").value = loanInfo.loanInterest;

}

document
  .getElementById("checkApproveNftBtn")
  .addEventListener("click", async () => {
    await checkClicked();
    console.log("check nft clicked");
  });

async function approveClicked() {
  const user = window.userAddress;
  try {
    const resp = await nftContract.methods.approve(escrowAddress, nftId).send({ "from": user });
  } catch (e) {
    console.log("nft approval error!", e);
  };
  console.log("nft approved!");
  // after successful approval, some alert should pop up to remind customers to click borrow button


};

document.getElementById("approveNftBtn").addEventListener("click", async () => {
  await approveClicked();
  console.log("approve nft clicked");
});



async function borrowClicked() {
  const user = window.userAddress;
  const loanAmount = toWei(document.getElementById("loanAmount").value);
  const loanPeriod = document.getElementById("loanPeriod").value;
  const loanInterest = document.getElementById("loanInterest").value; //???

  try {
    const resp = await escrowContract.methods.nftStaking(nftAddress, nftId).send({ "from": user });
  } catch (e) {
    console.log("nft staking error!", e);
  }
  console.log("nft staked!");
  try {
    const resp = await escrowContract.methods.loanTransfer(tokenAddress, user, loanAmount).send({ "from": user });
  } catch (e) {
    console.log("loan approval error!", e);
  }
  console.log("loan transferred!");

  const loanStartTime = Math.floor(Date.now() / 1000.0);
  const expireTime = loanStartTime + loanPeriod * 24 * 60 * 60;
  const repayAmount = loanAmount * (1 + loanInterest / 10000);
  // console.log(typeof (repayAmount));
  // console.log(loanStartTime);
  // console.log(expireTime);
  // console.log(repayAmount);
  try {
    const resp = await escrowContract.methods.nftLock(nftAddress, nftId, user, expireTime, repayAmount.toString()).send({ "from": user });
  } catch (e) {
    console.log("nft lock error!", e);
  }
  console.log("nft locked!");

  document.getElementById("repayAddress").value = user;
  document.getElementById("repayAmount").value = repayAmount;
  document.getElementById("expireTime").value = expireTime;


};

document.getElementById("borrowBtn").addEventListener("click", async () => {
  await borrowClicked();
  console.log("borrow btn clicked");
});

export { checkClicked, approveClicked, borrowClicked };

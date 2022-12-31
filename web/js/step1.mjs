

import { getLoanToken, getEscrow } from "./contract.mjs";


const nftAddress = "0x39fdf5565fa0b762b513a3e2ebe2517a63086821"; // many doggies
const nftJson = await inputJsonFile("../contracts/SimpleNFT.json");
const nftId = "2"; //30930";



async function getTokenBalance(user) {
  const { tokenAddress, tokenContract } = await getLoanToken();
  return await tokenContract.methods.balanceOf(user).call();
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


  const { escrowAddress, escrowContract } = await getEscrow();
  const nftContract = new web3.eth.Contract(nftJson.abi, nftAddress);
  console.log(escrowAddress);
  console.log(nftAddress);
  console.log(nftId);
  console.log(nftContract);
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

  console.log(loanAmount)
  console.log(loanPeriod)
  console.log(loanInterest)

  const { tokenAddress, tokenContract } = await getLoanToken();
  const { escrowAddress, escrowContract } = await getEscrow();

  try {
    const resp = await escrowContract.methods.setOffers(nftAddress, nftId, loanAmount, loanPeriod, loanInterest).send({ "from": user });
  } catch (e) {
    console.log("offers setting error!", e);
  }
  console.log("offers setted!");


  try {
    const offerInfo = await escrowContract.methods.getOffers(nftAddress, nftId).call({ "from": user });
    console.log(offerInfo);

  } catch (e) {
    console.log("offers getting error!", e);
  }
  console.log("offers got!");


  try {
    const resp = await escrowContract.methods.requestLoan(tokenAddress, nftAddress, nftId).send({ "from": user });
  } catch (e) {
    console.log("request loan error!", e);
  }
  console.log("loan requested!");

  // try {
  //   const resp = await escrowContract.methods.nftStaking(nftAddress, nftId).send({ "from": user });
  // } catch (e) {
  //   console.log("nft staking error!", e);
  // }
  // console.log("nft staked!");
  // try {
  //   const resp = await escrowContract.methods.loanTransfer(tokenAddress, user, loanAmount).send({ "from": user });
  // } catch (e) {
  //   console.log("loan approval error!", e);
  // }
  // console.log(escrowAddress);
  // console.log("loan transferred!");

  // const loanStartTime = Math.floor(Date.now() / 1000.0);
  const expireTime = await escrowContract.methods.nftLoanExpireTime(nftAddress, nftId).call({ "from": user });
  const repayAmount = await escrowContract.methods.nftLoanRepayAmount(nftAddress, nftId).call({ "from": user });
  // console.log(typeof (repayAmount));
  // console.log(loanStartTime);
  // console.log(expireTime);
  // console.log(repayAmount);
  // try {
  //   const resp = await escrowContract.methods.nftLock(nftAddress, nftId, user, expireTime, repayAmount.toString()).send({ "from": user });
  // } catch (e) {
  //   console.log("nft lock error!", e);
  // }
  // console.log("nft locked!");

  document.getElementById("repayAddress").value = user;
  document.getElementById("repayAmount").value = repayAmount;
  document.getElementById("expireTime").value = expireTime;


};

document.getElementById("borrowBtn").addEventListener("click", async () => {
  await borrowClicked();
  console.log("borrow btn clicked");
});

export { checkClicked, approveClicked, borrowClicked };

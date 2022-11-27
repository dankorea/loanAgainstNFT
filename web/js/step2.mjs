import { getEscrow, getLoanToken } from "./contract.mjs";


async function checkClicked() {
  const user = window.userAddress;

  const { escrowAddress, escrowContract } = await getEscrow();
  const stakedNftAddress = await escrowContract.methods.stakedNftAddress(user, 0).call({ "from": user });
  console.log(stakedNftAddress);
  document.getElementById("stakedNftAddress").value = stakedNftAddress;
  const stakedNftId = await escrowContract.methods.stakedNftId(user, 0).call({ "from": user });
  console.log(stakedNftId);
  document.getElementById("stakedNftId").value = stakedNftId;
}
document
  .getElementById("checkStakedNftsBtn")
  .addEventListener("click", async () => {
    await checkClicked();
    console.log("check staked nfts clicked");
  });

async function approveClicked() {
  const user = window.userAddress;
  const stakedNftAddress = document.getElementById("stakedNftAddress").value;
  const stakedNftId = document.getElementById("stakedNftId").value;

  const { tokenAddress, tokenContract } = await getLoanToken();
  const { escrowAddress, escrowContract } = await getEscrow();

  const redeemInfo = await escrowContract.methods.getNftLockData(stakedNftAddress, stakedNftId).call({ "from": user });
  const redeemAmount = redeemInfo[2];
  // const { redeemAddress, redeemDeadline, redeemAmount } = await escrowContract.methods.getNftLockData(stakedNftAddress, stakedNftId).call({ "from": user });
  // console.log(redeemAmount);
  // console.log(redeemDeadline);
  document.getElementById("redeemAmount").value = redeemAmount;
  document.getElementById("redeemDeadline").value = redeemInfo[1];

  const balance = await tokenContract.methods.balanceOf(user).call();
  console.log(balance);
  document.getElementById("tokenBalance").innerText = balance;

  if (balance < redeemAmount) {
    return alert("not enough token to repay!")
  };

  try {
    const resp = await tokenContract.methods.approve(escrowAddress, redeemAmount).send({ "from": user });
  } catch (e) {
    console.log("loan token approval error!", e);
  };
  console.log("loan token approved!");
  // after successful approval, some alert should pop up to remind customers to click borrow button

};
document.getElementById("approveTokenBtn").addEventListener("click", async () => {
  await approveClicked();
  console.log("approve token btn clicked")
});

async function repayClicked() {
  const user = window.userAddress;
  const redeemAmount = document.getElementById("redeemAmount").value;
  const { tokenAddress, tokenContract } = await getLoanToken();
  const { escrowAddress, escrowContract } = await getEscrow();

  try {
    const resp = await escrowContract.methods.loanRepay(tokenAddress, redeemAmount).send({ "from": user });
  } catch (e) {
    console.log("loan token repay error!", e);
  };
  console.log("loan token repayed!");

};
document.getElementById("repayBtn").addEventListener("click", async () => {
  await repayClicked();
  console.log("repay btn clicked");
});

async function unStakingClicked() {
  const user = window.userAddress;
  const stakedNftAddress = document.getElementById("stakedNftAddress").value;
  const stakedNftId = document.getElementById("stakedNftId").value;

  const { escrowAddress, escrowContract } = await getEscrow();


  try {
    const resp = await escrowContract.methods.nftUnStaking(stakedNftAddress, stakedNftId).send({ "from": user });
  } catch (e) {
    console.log("nft unstaking error!", e);
  };
  console.log("nft unstaked!");

};
document.getElementById("unStakingBtn").addEventListener("click", async () => {
  await unStakingClicked();
  console.log("unstaking btn clicked");
});

export { checkClicked, approveClicked, repayClicked, unStakingClicked };

// // config
// const approveNftBtn = document.getElementById("approveNft");
// document.getElementById("nftAddress").innerText = nftAddress;

// approveNftBtn.addEventListener("click", async () => {});

import { getTokenContract } from "./contract.mjs";

async function getTokenBalance(user) {
  const tokenContract = await getTokenContract();
  return await tokenContract.methods.balanceOf(user).call();
}

async function checkNftApprove() {
  const tokenContract = await getTokenContract();
  tokenContract.methods.allowance.call();
}

async function checkClicked() {
  const user = window.userAddress;
  const balance = await getTokenBalance(user);
  console.log(balance);

  document.getElementById("tokenBalance").innerText = balance;
}

document
  .getElementById("checkApproveTokenBtn")
  .addEventListener("click", async () => {
    await checkClicked();
    console.log("check token clicked");
  });

export { checkClicked };

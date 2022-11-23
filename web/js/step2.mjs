// // config
// const approveNftBtn = document.getElementById("approveNft");
// document.getElementById("nftAddress").innerText = nftAddress;

// approveNftBtn.addEventListener("click", async () => {});

import { getTokenContract } from "./contract.mjs";

const brownie_config = await inputJsonFile("../conf/brownie-config.json");
const helper_config = await inputJsonFile("../conf/helper-config.json");
const chainId = await web3.eth.net.getId();
// // 1. LOANT as loan token
// const networkMapping = await inputJsonFile("../contracts/map.json");
// const tokenAddress = networkMapping[chainId]["LoanToken"][0];
// 2. WETH as loan token
const networkName = helper_config[chainId];
const tokenAddress = brownie_config["networks"][networkName]["loan_token"];
const tokenJson = await inputJsonFile("../contracts/MockLoanToken.json");

console.log(chainId)

async function getTokenBalance(user) {
  const tokenContract = await getTokenContract(tokenJson, tokenAddress);
  return await tokenContract.methods.balanceOf(user).call();
}

async function checkNftApprove() {
  // const tokenContract = await getTokenContract();
  // tokenContract.methods.allowance.call();
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

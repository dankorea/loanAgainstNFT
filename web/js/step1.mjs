// // config
// const approveNftBtn = document.getElementById("approveNft");
// document.getElementById("nftAddress").innerText = nftAddress;

// approveNftBtn.addEventListener("click", async () => {});

import { getTokenContract } from "./contract.mjs";
import { getNftId } from "./nft.js";

const brownie_config = await inputJsonFile("../contracts/brownie-config.json");
const helper_config = await inputJsonFile("../contracts/helper-config.json");
const chainId = await web3.eth.net.getId();
const networkMapping = await inputJsonFile("../contracts/map.json");
// // 1. LOANT as loan token
// const tokenAddress = networkMapping[chainId]["LoanToken"][0];
// 2. WETH as loan token
const networkName = helper_config[chainId];
const tokenAddress = brownie_config["networks"][networkName]["loan_token"];
const tokenJson = await inputJsonFile("../contracts/MockLoanToken.json");

const nftAddress = networkMapping[chainId]["SimpleNFT"][0];
// const nftAddress = "0x3a1e7aba44bf21a66344d7a0f795a7df0b49ed60"; // the XENFT
const nftJson = await inputJsonFile("../contracts/SimpleNFT.json");

console.log(chainId)

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

  return await nftContract.methods.tokenURI(nftId).call();//???
}
async function checkClicked() {
  const user = window.userAddress;
  const balance = await getNftBalance(user);
  const nftId = await getNftId(nftAddress);
  // const nftUri = await getNftUri(nftId);
  console.log(balance);
  console.log(nftId);
  document.getElementById("nftContractAddress").value = nftAddress;
  document.getElementById("nftIndex").value = nftId;
  // document.getElementById("nftUri").value = nftUri;
}

document
  .getElementById("checkApproveNftBtn")
  .addEventListener("click", async () => {
    await checkClicked();
    console.log("check nft clicked");
  });

export { checkClicked };

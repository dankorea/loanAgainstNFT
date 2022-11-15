const tokenAddress = "0x9C9fe06823d3883D8648dAAFc05d48264ed54e6B";

async function getTokenContract() {
  const tokenJson = await inputJsonFile("../contracts/MockLoanToken.json");
  const token = new web3.eth.Contract(tokenJson.abi, tokenAddress);
  return token;
}

async function initUI() {
  document.getElementById("tokenAddress").innerText = tokenAddress;
}

initUI();

export { getTokenContract };

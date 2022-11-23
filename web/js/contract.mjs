async function getTokenContract(tokenJson, tokenAddress) {
  const token = new web3.eth.Contract(tokenJson.abi, tokenAddress);
  return token;
}


async function initUI() {
  document.getElementById("tokenAddress").innerText = tokenAddress;
}

initUI();

export { getTokenContract };



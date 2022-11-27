async function getLoanToken() {
  const brownie_config = await inputJsonFile("../conf/brownie-config.json");
  const helper_config = await inputJsonFile("../conf/helper-config.json");
  // // 1. LOANT as loan token
  // const tokenAddress = networkMapping[chainId]["LoanToken"][0];
  // 2. WETH as loan token
  const chainId = await web3.eth.net.getId();
  const networkName = helper_config[chainId];
  const tokenAddress = brownie_config["networks"][networkName]["loan_token"];
  const tokenJson = await inputJsonFile("../contracts/MockLoanToken.json");
  const tokenContract = new web3.eth.Contract(tokenJson.abi, tokenAddress);

  return { tokenAddress, tokenContract };
}

async function getEscrow() {
  const chainId = await web3.eth.net.getId();
  const networkMapping = await inputJsonFile("../conf/map.json");
  const escrowAddress = networkMapping[chainId]["Escrow"][0];
  const escrowJson = await inputJsonFile("../contracts/Escrow.json");
  console.log(networkMapping)
  console.log(chainId)
  console.log(escrowAddress)

  const escrowContract = new web3.eth.Contract(escrowJson.abi, escrowAddress);
  return { escrowAddress, escrowContract };
}

async function initUI() {
  document.getElementById("tokenAddress").innerText = tokenAddress;
}

initUI();

export { getLoanToken, getEscrow };



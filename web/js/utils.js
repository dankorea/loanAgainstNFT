function fromWei(val) {
  return web3.utils.fromWei(val);
}

function toWei(val) {
  return web3.utils.toWei(val);
}

async function inputJsonFile(path) {
  try {
    const resp = await fetch(path);
    return await resp.json();
  } catch {
    console.log("error get json:", path);
    return {};
  }
}

function showLoanableNfts(item) {
  const li = document.createElement("li");
  li.className = "p-2 m-2 border";
  const title = document.createElement("div");
  title.innerText = item.title;
  title.className = "text-xl text-bold font-serif";
  li.appendChild(title);
  const contractAddr = document.createElement("div");
  contractAddr.innerText = item.contract.address;
  contractAddr.className = "text-sm";
  li.appendChild(contractAddr);
  const tokenID = document.createElement("div");
  console.log(eval(item.id.tokenId).toString(10));
  // console.log(item.id.tokenId);
  tokenID.innerText = eval(item.id.tokenId).toString(10);
  tokenID.className = "text-sm";
  li.appendChild(tokenID);
  const description = document.createElement("div");
  description.innerText = item.description;
  description.className = "text-sm";
  li.appendChild(description);
  const imgUrl = item.media[0].gateway;
  if (imgUrl) {
    const pic = new Image(100, 100);
    pic.setAttribute("loading", "lazy");
    pic.setAttribute("src", imgUrl);
    li.appendChild(pic);
  }

  // how to click the button and send the corresponding nft info???
  const offerBtn = document.createElement("button");
  offerBtn.type = "submit";
  offerBtn.innerText = "My Offers";
  li.appendChild(offerBtn);

  return li;
}

// Replace with your Alchemy API key:
const apiKey = "kwsMzj1VR4HA96zyzSIDg6lqSV2NU4ho";
// Setup request options:
const requestOptions = {
  method: "GET",
  redirect: "follow",
};
// const whiteListContractAddr = ["0x3a1e7aba44bf21a66344d7a0f795a7df0b49ed60", "0x06c586b4a9f95d6480cf6ab66ae16c3a391d7f02"]; // doggie and XENft address
// ??? need contract upgrade to get allowedNfts by function

async function getNfts(ownerAddr) {
  const user = window.userAddress;
  const chainId = await web3.eth.net.getId();
  const networkMapping = await inputJsonFile("../conf/map.json");
  const escrowAddress = networkMapping[chainId]["Escrow"][0];
  const escrowJson = await inputJsonFile("../contracts/Escrow.json");
  const escrowContract = new web3.eth.Contract(escrowJson.abi, escrowAddress);
  const numOfAllowedNfts = await escrowContract.methods.numOfAllowedNfts().call({ "from": user });
  let whiteListContractAddr = [];
  for (let i = 0; i < numOfAllowedNfts; i++) {
    whiteListContractAddr[i] = await escrowContract.methods.allowedNfts(i).call({ "from": user });
  }

  // const allowedNfts = await escrowContract.methods.allowedNfts().call({ "from": user });
  console.log(whiteListContractAddr);

  // const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs/`;
  const baseURL = `https://eth-goerli.g.alchemy.com/nft/v2/${apiKey}/getNFTs/`;
  const withMetadata = true;
  const fetchURL = `${baseURL}?owner=${ownerAddr}&withMetadata=${withMetadata}&contractAddresses[]=${whiteListContractAddr}`;
  console.log(fetchURL, requestOptions);
  try {
    const resp = await fetch(fetchURL, requestOptions);
    return resp.json();
  } catch (e) {
    console.log("get nft error", e);
  }
}

async function getNftMetadata(contractAddr, tokenId, tokenType) {
  // e.g. getNftMetadata("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d","2","erc721")
  // const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${demo}/getNFTMetadata`;
  const baseURL = `https://eth-goerli.g.alchemy.com/nft/v2/${demo}/getNFTMetadata`;
  const fetchURL = `${baseURL}?contractAddress=${contractAddr}&tokenId=${tokenId}&tokenType=${tokenType}`;
  console.log(fetchURL, requestOptions);
  try {
    const resp = await fetch(fetchURL, requestOptions);
    return resp.json();
  } catch (e) {
    console.log("get nft metadata error", e);
  }
}

async function showOffers(contractAddr, tokenId) {
  const loanAmount = 0.001;
  const loanPeriod = 3;
  const loanInterest = 286; // decimal: 4
  return { loanAmount, loanPeriod, loanInterest };

}

// export { fromWei, toWei, inputJsonFile, getNfts, getNftMetadata, showOffers };

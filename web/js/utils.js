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

// Replace with your Alchemy API key:
const apiKey = "kwsMzj1VR4HA96zyzSIDg6lqSV2NU4ho";
// Setup request options:
const requestOptions = {
  method: "GET",
  redirect: "follow",
};

async function getNfts(ownerAddr) {
  // e.g. getNfts("0xF5FFF32CF83A1A614e15F25Ce55B0c0A6b5F8F2c")
  // const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs/`;
  const baseURL = `https://eth-goerli.g.alchemy.com/nft/v2/${apiKey}/getNFTs/`;
  const whiteListContractAddr = ["0x3a1e7aba44bf21a66344d7a0f795a7df0b49ed60", "0x06c586b4a9f95d6480cf6ab66ae16c3a391d7f02"]; // doggie and XENft address
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
  const loanAmount = 0.01;
  const loanPeriod = 3;
  const loanInterest = 286; // decimal: 4
  return { loanAmount, loanPeriod, loanInterest };

}

// export { fromWei, toWei, inputJsonFile, getNfts, getNftMetadata, showOffers };

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
  const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs/`;
  const fetchURL = `${baseURL}?owner=${ownerAddr}`;
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
  const baseURL = `https://eth-mainnet.g.alchemy.com/nft/v2/${demo}/getNFTMetadata`;
  const fetchURL = `${baseURL}?contractAddress=${contractAddr}&tokenId=${tokenId}&tokenType=${tokenType}`;
  console.log(fetchURL, requestOptions);
  try {
    const resp = await fetch(fetchURL, requestOptions);
    return resp.json();
  } catch (e) {
    console.log("get nft metadata error", e);
  }
}

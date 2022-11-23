// This script demonstrates access to the NFT API via the Alchemy SDK.
import {
    Network,
    initializeAlchemy,
    getNftsForOwner,
    getNftMetadata,
    // BaseNft,
    // NftTokenType,
} from "@alch/alchemy-sdk";

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
    // goerli
    apiKey: "xxx",
    network: Network.ETH_GOERLI,
    // // Mainnet
    // apiKey: "xxx",
    // network: Network.ETH_MAINNET,

    maxRetries: 10,
};

const alchemy = initializeAlchemy(settings);

// // Mainnet
// const myAddr = "xxx";
// const theNftAddr = "xxx"; // 10ktf combat gear
// const theNftId = "xxx"; // common pilot helmet 
// const theNftAddr = "xxx"; // 10ktf
// const theNftId = "xxx"; // epic comfy hoddie
// goerli
const myAddr = "xxx";
const theNftAddr = "xxx";
const theNftId = "xxx";

// Print owner's wallet address:
const ownerAddr = myAddr;
console.log("fetching NFTs for address:", ownerAddr);
console.log("...");

// // Print total NFT count returned in the response:
// const nftsForOwner = await getNftsForOwner(alchemy, ownerAddr);
// console.log("number of NFTs found:", nftsForOwner.totalCount);
// console.log("...");

// // Print contract address and tokenId for each NFT:
// for (const nft of nftsForOwner.ownedNfts) {
//     console.log("===");
//     console.log("contract address:", nft.contract.address);
//     console.log("token ID:", nft.tokenId);
// }
// console.log("===");

// Fetch metadata for a particular NFT:
console.log("fetching metadata for a Crypto Coven NFT...");
const response = await getNftMetadata(
    alchemy,
    theNftAddr,
    theNftId
);

// Uncomment this line to see the full api response:
// console.log(response);

// Print some commonly used fields:
// console.log("NFT name: ", response.title);
// console.log("token type: ", response.tokenType);
console.log("tokenUri: ", response.tokenUri.gateway);
console.log("image url: ", response.rawMetadata.image);
console.log("time last updated: ", response.timeLastUpdated);
console.log("attributes: ", response.rawMetadata.attributes);
console.log("attributes: ", response.rawMetadata.attributes[5]);
console.log("attributes: ", response.rawMetadata.attributes[6]);
console.log("===");
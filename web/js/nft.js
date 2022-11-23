// import {
//     Network,
//     initializeAlchemy,
//     getNftsForOwner,
//     getNftMetadata,
//     // BaseNft,
//     // NftTokenType,
// } from "@alch/alchemy-sdk";

// // const chainId = await web3.eth.net.getId();
// // const networkName = helper_config[chainId];

// // Optional Config object, but defaults to demo api-key and eth-mainnet.
// const settings = {
//     apiKey: "Ymq9_p-HOnYxmaUxAIaRGB0Gi75BvgpU",
//     network: Network.ETH_GOERLI,
// };

// const alchemy = initializeAlchemy(settings);

async function getNftId(nftAddress) {
    // // only fetch the first matched id
    // const ownerAddr = "0x6802AD9d71976Cd2C6c10aB093809D8237beedd2";
    // console.log("fetching NFTs for address:", ownerAddr);
    // console.log("...");

    // // Print total NFT count returned in the response:
    // const nftsForOwner = await getNftsForOwner(alchemy, ownerAddr);
    // console.log("number of NFTs found:", nftsForOwner.totalCount);
    // console.log("...");

    // // Print contract address and tokenId for each NFT:
    // for (const nft of nftsForOwner.ownedNfts) {
    //     if (nftAddress == nft.contract.address) {
    //         return nft.tokenId;
    //     };
    // }
    // return "30930"; // XENFT id
    return "0"; // Simple NFT
}

async function getNftRank(nftAddress, nftId) {
    // return rank coefficent
    return 1;
}
export { getNftId, getNftRank };

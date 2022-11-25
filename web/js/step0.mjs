// const chainId = await web3.eth.net.getId();
// const networkMapping = await inputJsonFile("../conf/map.json");
// const escrowAddress = networkMapping[chainId]["Escrow"][0];
// const escrowJson = await inputJsonFile("../contracts/Escrow.json");
// const escrowContract = new web3.eth.Contract(escrowJson.abi, escrowAddress);


// async function addAllowedClicked() {
//     const user = window.userAddress;
//     console.log(user);
//     const allowingNftAddress = document.getElementById("allowingNft").value;
//     if (allowingNftAddress) {
//         try {
//             await escrowContract.methods.addAllowedNfts(allowingNftAddress).send({ "from": user });

//         } catch (e) {
//             console.log("add allowed nft error!", e);
//         };
//         console.log("allowed nft added!");
//     };
// };
// document.getElementById("addAllowedBtn").addEventListener("click", async () => {
//     await addAllowedClicked();
//     console.log("add allowed nft btn clicked")
// });


async function showLoanableClicked() {
    const user = window.userAddress;
    console.log(user);
    getNfts(user).then((resp) => {
        console.log(resp);
        if (resp && resp.ownedNfts) {
            const ul = document.createElement("ul");
            ul.className = "grid grid-cols-3 gap-4"
            document.getElementById("main").appendChild(ul);
            resp.ownedNfts.forEach((item) => {
                const li = showLoanableNfts(item);
                ul.appendChild(li);
            });
        }
    });

};
document.getElementById("showLoanableBtn").addEventListener("click", async () => {
    await showLoanableClicked();
    console.log("show loanable nft btn clicked");

});

export { showLoanableClicked }

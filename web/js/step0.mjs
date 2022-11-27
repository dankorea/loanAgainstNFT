import { getEscrow } from "./contract.mjs";

async function addAllowedClicked() {
    const user = window.userAddress;
    const { escrowAddress, escrowContract } = await getEscrow();
    const updatingNftAddress = document.getElementById("updatingNft").value;
    if (updatingNftAddress && escrowContract) {
        try {
            await escrowContract.methods.updateAllowedNfts(updatingNftAddress, true).send({ "from": user });

        } catch (e) {
            console.log("add allowed nft error!", e);
        };
        console.log("allowed nft added!");
    };
};
document.getElementById("addAllowedBtn").addEventListener("click", async () => {
    await addAllowedClicked();
    console.log("add allowed nft btn clicked")
});

async function delAllowedClicked() {
    const user = window.userAddress;

    const { escrowAddress, escrowContract } = await getEscrow();
    const updatingNftAddress = document.getElementById("updatingNft").value;

    if (updatingNftAddress && escrowContract) {
        try {
            await escrowContract.methods.updateAllowedNfts(updatingNftAddress, false).send({ "from": user });

        } catch (e) {
            console.log("del allowed nft error!", e);
        };
        console.log("allowed nft deleted!");
    };
};
document.getElementById("delAllowedBtn").addEventListener("click", async () => {
    await delAllowedClicked();
    console.log("del allowed nft btn clicked")
});

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

export { showLoanableClicked, addAllowedClicked, delAllowedClicked }

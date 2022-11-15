document.getElementById("tokenAddress").innerText = tokenAddress;
const checkTokenBtn = document.getElementById("checkTokenApprove")
checkTokenBtn.addEventListener("click", async () => {});
async function checkTokenApprove(userAddress) {
  return await token.methods.allowance.call(userAddress, nftAddress);
}

import {
  ethereum,
  getUserBasicInfo,
  loginClicked,
  logOutClicked,
} from "./basic.mjs";

window.onload = async () => {
  if (ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      getUserBasicInfo();
    } catch (error) {
      console.log("get user info error");
    }
  } else {
    alert("Please install MetaMask Extension in your browser");
  }

  document.querySelectorAll(".loginBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const isLoggedIn = window.userAddress ? true : false;
      console.log("clicked", window.userAddress, isLoggedIn);
      if (isLoggedIn) {
        logOutClicked();
      } else {
        loginClicked();
      }
    });
  });
};

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

getNfts("0x6802AD9d71976Cd2C6c10aB093809D8237beedd2").then((resp) => {
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

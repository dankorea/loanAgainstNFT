window.onload = async () => {
  const { ethereum } = window;

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

  function setUserInfo() {
    const main = document.getElementById("main");
    const isLoggedIn = window.userAddress ? true : false;
    console.log(isLoggedIn);
    document.querySelectorAll(".loginBtn").forEach((btn) => {
      if (isLoggedIn) {
        btn.innerText = "Logout";
        main.classList.remove("hidden");
      } else {
        btn.innerText = "Login";
        main.classList.add("hidden");
      }
    });
  }

  async function getUserBasicInfo() {
    const accounts = await web3.eth.getAccounts();
    if (accounts && accounts[0]) {
      const userAddress = accounts[0];
      window.userAddress = userAddress;
      const balance = await web3.eth.getBalance(userAddress);
      document.getElementById("address").innerText = userAddress;
      const ethBalance = fromWei(balance);
      document.getElementById("balance").innerText = `${ethBalance} ETH`;
      setUserInfo();
    }
  }

  async function loginClicked() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    window.userAddress = accounts[0];
    await getUserBasicInfo();
    setUserInfo();
  }

  async function logOutClicked() {
    window.userAddress = null;
    document.getElementById("address").innerText = "---";
    document.getElementById("balance").innerText = "--- ETH";
    setUserInfo();
  }
};

var brownieConfig = require('../contracts/brownie-config.json')
// tokens init
const chainId = web3.eth.chainId
var helperConfig = require('../contracts/helper-config.json')
const networkName = chainId ? helperConfig[chainId] : "dev"
networkMapping = require('../contracts/map.json')

const nftAddress = networkMapping[chainId]["SimpleNFT"][0];
const nftJson = require("../contracts/SimpleNFT.json");
const nft = new web3.eth.Contract(nftJson, nftAddress);

const tokenAddress = chainId ? brownieConfig["networks"][networkName]["loan_token"] : "0x0000000000000000";
const tokenJson = require("../contracts/MockLoanToken.json");
const token = new web3.eth.Contract(tokenJson, tokenAddress);

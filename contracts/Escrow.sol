//SPDX-License-Identifier: MIT

// principles: minimize memory storage, breakdown a complex on-chain action to several short actions
// Must functions: connectWallet, showLoanableNFT, setBasePrice(real fp deal in 14days), setThreshold(e.g., 60%on base price),
//                 autoGenOffers(3 offers: amount[100,80,60], period[3,7,14], APR[80,100,120], +some random disturbation),
//                 manGenOffers(amount, period, APR, ),
//                 updateOffers(offerIndex, update=0:del/1:update/2)
//                 acceptOffer(approveTransfer, nftDeposit,loanTransfer)
// Later functions: getPrice, showOffers, makeOffers, approve,sendOffers
// Struct: offer{evalAmount, loanPeriod, interest}
// Global array: arrPeriod[3,7,14], arrAPR, arrLoanRatio
// randome value: randDeltaAPR,randDeltaLoanRatio

// ? how to get rarity info. then corresponding evalPrice -> metadata
// ? how to achieve bundle or reduce gas fee
//
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Escrow is Ownable {
    address[] public allowedNfts;
    mapping(address => address) public nftPriceFeedMapping; // need to upgraded to ranks
    address lender;
    address inspector;

    IERC20 public dappToken;

    struct loanOffer {
        // struct may not be suggested, just use single variables
        uint256 _loanAmount; //18 decimals in ether(wei)
        uint256 _loanDays; // in days
        uint256 _loanInterest; //with decimals 10**4, e.g. 2.83% = 283/(10**4)
    }
    uint256 public interestDecimals = 4;

    // mapping borrower address -> borrower stake index -> staked NFT address and ID
    mapping(address => mapping(uint256 => address)) public stakedNftAddress;
    mapping(address => mapping(uint256 => uint256)) public stakedNftId;
    // mapping borrower address -> nft address -> nft ID -> staked index
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        public stakedNftIndex;
    mapping(address => uint256) public numOfNftStaked;
    address[] public borrowers;
    mapping(address => uint256) public borrowerIndex;
    // mapping nft address -> nft id -> { expireTime, repayAmount, holderAddress}
    mapping(address => mapping(uint256 => uint256)) public nftLoanRepayAmount;
    mapping(address => mapping(uint256 => uint256)) public nftLoanExpireTime;
    mapping(address => mapping(uint256 => address)) public nftLoanHolderAddress;
    // mapping nft address -> nft id -> { loanPeriod, loanAmount, loanInterest}
    mapping(address => mapping(uint256 => uint256)) public nftLoanAmount; // unit: wei
    mapping(address => mapping(uint256 => uint256)) public nftLoanPeriod; // unit: days
    mapping(address => mapping(uint256 => uint256)) public nftLoanInterest; // decimals: 4

    constructor(address _dappTokenAddress) public {
        dappToken = IERC20(_dappTokenAddress);
    }

    function loanRepay(address _loanTokenAddress, uint256 _repayAmount) public {
        // where shall we put approve action, here or in .py?
        IERC20(_loanTokenAddress).transferFrom(
            msg.sender,
            address(this),
            _repayAmount
        );
    }

    function loanTransfer(
        address _loanTokenAddress,
        address _nftHolderAddress,
        uint256 _loanAmount
    ) public onlyOwner {
        // is onlyOwner used here correct?
        IERC20(_loanTokenAddress).transfer(_nftHolderAddress, _loanAmount);
    }

    function nftUnStaking(address _nftAddress, uint256 _nftId)
        public
        onlyOwner
    {
        // must satisfy:
        // 1. time not expire,
        // 2. repay enough,
        // 3. the owner is the owner
        require(
            nftIsAllowed(_nftAddress),
            "current nft is not allowed in our whitelist!"
        );

        IERC721(_nftAddress).transferFrom(address(this), msg.sender, _nftId);
        uint256 index = stakedNftIndex[msg.sender][_nftAddress][_nftId];
        address nft_address = stakedNftAddress[msg.sender][
            numOfNftStaked[msg.sender]
        ];
        uint256 nft_id = stakedNftId[msg.sender][numOfNftStaked[msg.sender]];
        stakedNftAddress[msg.sender][index] = nft_address;
        stakedNftId[msg.sender][index] = nft_id;
        stakedNftIndex[msg.sender][nft_address][nft_id] = index;
        numOfNftStaked[msg.sender] = numOfNftStaked[msg.sender] - 1;

        if (numOfNftStaked[msg.sender] == 0) {
            index = borrowerIndex[msg.sender];
            borrowers[index] = borrowers[borrowers.length - 1];
            borrowerIndex[borrowers[index]] = index;
            borrowers.pop();
        }
    }

    function nftStaking(address _nftAddress, uint256 _nftId) public {
        // what NFT can they stake?
        require(
            nftIsAllowed(_nftAddress),
            "current nft is not allowed in our whitelist!"
        );
        IERC721(_nftAddress).transferFrom(msg.sender, address(this), _nftId);
        stakedNftAddress[msg.sender][numOfNftStaked[msg.sender]] = _nftAddress;
        stakedNftId[msg.sender][numOfNftStaked[msg.sender]] = _nftId;
        stakedNftIndex[msg.sender][_nftAddress][_nftId] = numOfNftStaked[
            msg.sender
        ];
        if (numOfNftStaked[msg.sender] == 0) {
            borrowers.push(msg.sender);
            borrowerIndex[msg.sender] = borrowers.length - 1;
        }
        numOfNftStaked[msg.sender] = numOfNftStaked[msg.sender] + 1;
    }

    function setOffers(
        address _nftAddress,
        uint256 _nftId,
        uint256 _loanAmount,
        uint256 _loanPeriod,
        uint256 _loanInterest
    ) public onlyOwner {
        nftLoanAmount[_nftAddress][_nftId] = _loanAmount;
        nftLoanInterest[_nftAddress][_nftId] = _loanInterest;
        nftLoanPeriod[_nftAddress][_nftId] = _loanPeriod;
    }

    function getOffers(address _nftAddress, uint256 _nftId)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 loan_amount = nftLoanAmount[_nftAddress][_nftId];
        uint256 loan_interest = nftLoanInterest[_nftAddress][_nftId];
        uint256 loan_period = nftLoanPeriod[_nftAddress][_nftId];
        return (loan_amount, loan_period, loan_interest);
    }

    function nftLock(
        address _nftAddress,
        uint256 _nftId,
        address _holderAddress,
        uint256 _expireTime,
        uint256 _repayAmount
    ) public onlyOwner {
        // nft lock parameters setting, is the function public ok?
        nftLoanHolderAddress[_nftAddress][_nftId] = _holderAddress;
        nftLoanExpireTime[_nftAddress][_nftId] = _expireTime;
        nftLoanRepayAmount[_nftAddress][_nftId] = _repayAmount;
    }

    function getNftLockData(address _nftAddress, uint256 _nftId)
        public
        view
        returns (
            address,
            uint256,
            uint256
        )
    {
        return (
            nftLoanHolderAddress[_nftAddress][_nftId],
            nftLoanExpireTime[_nftAddress][_nftId],
            nftLoanRepayAmount[_nftAddress][_nftId]
        );
    }

    function addAllowedNfts(address _nftAddress) public onlyOwner {
        allowedNfts.push(_nftAddress);
    }

    function nftIsAllowed(address _nftAddress) public view returns (bool) {
        for (
            uint256 allowedNftsIndex = 0;
            allowedNftsIndex < allowedNfts.length;
            allowedNftsIndex++
        ) {
            if (allowedNfts[allowedNftsIndex] == _nftAddress) {
                return true;
            }
        }
        return false;
    }

    function isBorrowers(address _user) public view returns (bool) {
        for (uint256 index = 0; index < allowedNfts.length; index++) {
            if (borrowers[index] == _user) {
                return true;
            }
        }
        return false;
    }

    modifier onlyBorrower() {
        require(isBorrowers(msg.sender), "Only borrower can call this method");
        _;
    }

    modifier onlyLender() {
        require(msg.sender == lender, "Only lender can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // function requestLoan(
    //     address _loanTokenAddress,
    //     address _nftAddress,
    //     uint256 _nftId,
    //     uint256 _loanAmount,
    //     uint256 _loanDays,
    //     uint256 _loanInterest
    // ) public {
    //     require(
    //         nftIsAllowed(_nftAddress),
    //         "current nft is not allowed in our whitelist!"
    //     );
    //     nftStaking(_nftAddress, _nftId);
    //     IERC20(_loanTokenAddress).transfer(address(msg.sender), _loanAmount);
    //     uint256 initTime = block.timestamp;
    //     uint256 expireTime = initTime + _loanDays * 24 * 60 * 60;
    //     uint256 repayAmount = _loanAmount *
    //         (1 + _loanInterest / (10**interestDecimals));
    //     nftLock(
    //         _nftAddress,
    //         _nftId,
    //         address(msg.sender),
    //         expireTime,
    //         repayAmount
    //     );
    // }

    // e.g.: give 1 DappToken per loanToken loan
    function issueTokens() public onlyOwner {
        // ? get each borrower total loan interest profit
        // ? get each NFT (address, id) loaned interest profit
        // Issue tokens to all stakers
        for (uint256 index = 0; index < borrowers.length; index++) {
            address recipient = borrowers[index];
            uint256 userTotalValue = getUserTotalValue(recipient);
            dappToken.transfer(recipient, userTotalValue);
        }
    }

    function getUserTotalValue(address _user) public view returns (uint256) {
        uint256 totalValue = 0;
        // require(numOfNftStaked[_user] > 0, "No nft staked!");
        if (numOfNftStaked[_user] <= 0) {
            return 0;
        }
        for (
            uint256 nftStakedIndex = 0;
            nftStakedIndex < numOfNftStaked[_user];
            nftStakedIndex++
        ) {
            totalValue =
                totalValue +
                getUserSingleNftValue(
                    _user,
                    stakedNftAddress[_user][nftStakedIndex],
                    stakedNftId[_user][nftStakedIndex]
                );
        }
        return totalValue;
    }

    function getUserSingleNftValue(
        address _user,
        address _nftAddress,
        uint256 _nftId
    ) public view returns (uint256) {
        if (numOfNftStaked[_user] <= 0) {
            return 0;
        }
        (uint256 price, uint256 decimals) = getNftValue(_nftAddress, _nftId);
        return (price / (10**decimals));
        // 10000000000000000000 ETH
        // ETH/USD -> 10000000000
        // 10 * 100 = 1,000
    }

    function getNftValue(address _nftAddress, uint256 _nftId)
        public
        view
        returns (uint256, uint256)
    {
        // // default setted to 1ETH and 18decimals
        // return (1, 18);

        // priceFeedAddress
        // address priceFeedAddress = nftPriceFeedMapping[_nftAddress][_nftId];
        address priceFeedAddress = nftPriceFeedMapping[_nftAddress];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeedAddress
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint256 decimals = uint256(priceFeed.decimals());
        return (uint256(price), decimals);
    }

    function setPriceFeedContract(
        address _nftAddress,
        // uint256 _nftId=none,
        address _priceFeed
    ) public onlyOwner {
        // nftPriceFeedMapping[_nftAddress][_nftId] = _priceFeed;
        nftPriceFeedMapping[_nftAddress] = _priceFeed;
    }
}

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
    uint256 public numOfAllowedNfts;
    mapping(address => address) public nftPriceFeedMapping; // need to upgraded to ranks

    IERC20 public dappToken;

    uint256 public interestDecimals = 4;

    // mapping borrower address -> borrower stake index -> staked NFT address and ID
    mapping(address => mapping(uint256 => address)) public stakedNftAddress;
    mapping(address => mapping(uint256 => uint256)) public stakedNftId;
    // mapping borrower address -> nft address -> nft ID -> staked index
    mapping(address => mapping(address => mapping(uint256 => uint256)))
        public stakedNftIndex;
    mapping(address => uint256) public numOfNftStaked;
    address[] public borrowers;
    uint256 public numOfBorrowers;
    mapping(address => uint256) public borrowerIndex;
    // mapping nft address -> nft id -> { expireTime, repayAmount, holderAddress}
    mapping(address => mapping(uint256 => uint256)) public nftLoanRepayAmount;
    mapping(address => mapping(uint256 => uint256)) public nftLoanExpireTime;
    mapping(address => mapping(uint256 => address)) public nftLoanHolderAddress;
    // mapping nft address -> nft id -> { loanPeriod, loanAmount, loanInterest}  Final loan offer
    mapping(address => mapping(uint256 => uint256)) public nftLoanAmount; // unit: wei
    mapping(address => mapping(uint256 => uint256)) public nftLoanPeriod; // unit: days
    mapping(address => mapping(uint256 => uint256)) public nftLoanInterest; // decimals: 4
    // mapping nft address -> nft id -> { loanPeriod, loanAmount, loanInterest} Specific loan offer
    mapping(address => mapping(uint256 => uint256))
        public nftSpecificLoanAmount; // unit: wei
    mapping(address => mapping(uint256 => uint256))
        public nftSpecificLoanPeriod; // unit: days
    mapping(address => mapping(uint256 => uint256))
        public nftSpecificLoanInterest; // decimals: 4
    // mapping nft address -> { loanPeriod, loanAmount, loanInterest} collection loan offer
    mapping(address => uint256) nftCollectionLoanAmountS; // unit: wei
    mapping(address => uint256) nftCollectionLoanPeriodS; // unit: days
    mapping(address => uint256) nftCollectionLoanInterestS; // decimals: 4
    mapping(address => uint256) nftCollectionLoanAmountM; // unit: wei
    mapping(address => uint256) nftCollectionLoanPeriodM; // unit: days
    mapping(address => uint256) nftCollectionLoanInterestM; // decimals: 4
    mapping(address => uint256) nftCollectionLoanAmountL; // unit: wei
    mapping(address => uint256) nftCollectionLoanPeriodL; // unit: days
    mapping(address => uint256) nftCollectionLoanInterestL; // decimals: 4

    constructor(address _dappTokenAddress) public {
        dappToken = IERC20(_dappTokenAddress);
        numOfAllowedNfts = 0;
    }

    function loanRepay(address _loanTokenAddress, uint256 _repayAmount)
        internal
    {
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
    ) internal {
        // is onlyOwner used here correct?
        IERC20(_loanTokenAddress).transfer(_nftHolderAddress, _loanAmount);
    }

    function loanMTransfer(
        address _loanTokenAddress,
        address _nftHolderAddress,
        uint256 _loanAmount
    ) public onlyOwner {
        // is onlyOwner used here correct?
        IERC20(_loanTokenAddress).transfer(_nftHolderAddress, _loanAmount);
    }

    function requestLoan(
        address _loanTokenAddress,
        address _nftAddress,
        uint256 _nftId,
        uint256 _selIndex
    ) public {
        require(
            nftIsAllowed(_nftAddress),
            "current nft is not allowed in our whitelist!"
        );

        (
            uint256 _loanAmount,
            uint256 _loanDays,
            uint256 _loanInterest
        ) = getOffers(_nftAddress, _nftId, _selIndex);
        require(
            IERC20(_loanTokenAddress).balanceOf(address(this)) >= _loanAmount,
            "Current lender has not sufficient fund, please contact our staff~"
        );
        nftStaking(_nftAddress, _nftId);
        loanTransfer(_loanTokenAddress, address(msg.sender), _loanAmount);
        nftLoanAmount[_nftAddress][_nftId] = _loanAmount;
        nftLoanPeriod[_nftAddress][_nftId] = _loanDays;
        nftLoanInterest[_nftAddress][_nftId] = _loanInterest;
        // IERC20(_loanTokenAddress).transfer(address(msg.sender), _loanAmount);
        uint256 initTime = block.timestamp;
        uint256 expireTime = initTime + _loanDays * 24 * 60 * 60;
        uint256 repayAmount = (_loanAmount *
            (1 * (10**interestDecimals) + _loanInterest)) /
            (10**interestDecimals);
        nftLock(
            _nftAddress,
            _nftId,
            address(msg.sender),
            expireTime,
            repayAmount
        );
    }

    function redeemLoan(
        address _loanTokenAddress,
        address _nftAddress,
        uint256 _nftId
    ) public {
        require(
            nftIsAllowed(_nftAddress),
            "current nft is not allowed in our whitelist!"
        );

        (
            address holder_address,
            uint256 expire_time,
            uint256 repay_amount
        ) = getNftLockData(_nftAddress, _nftId);
        uint256 currentTime = block.timestamp;
        require(
            holder_address == msg.sender,
            "please use correct wallet to repay and unstake!"
        );
        require(
            currentTime < expire_time,
            "your loan is overdue, please contact our staff to find solution!"
        );
        require(
            IERC20(_loanTokenAddress).balanceOf(msg.sender) >= repay_amount,
            "your balance is not enough to replay the loan!"
        );
        loanRepay(_loanTokenAddress, repay_amount);
        nftUnStaking(_nftAddress, _nftId);
    }

    function nftStaking(address _nftAddress, uint256 _nftId) internal {
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
            numOfBorrowers = numOfBorrowers + 1;
        }
        numOfNftStaked[msg.sender] = numOfNftStaked[msg.sender] + 1;
    }

    function nftUnStaking(address _nftAddress, uint256 _nftId) internal {
        require(
            nftIsAllowed(_nftAddress),
            "current nft is not allowed in our whitelist!"
        );

        IERC721(_nftAddress).transferFrom(address(this), msg.sender, _nftId);
        uint256 index = stakedNftIndex[msg.sender][_nftAddress][_nftId];
        address nft_address = stakedNftAddress[msg.sender][
            numOfNftStaked[msg.sender] - 1
        ];
        uint256 nft_id = stakedNftId[msg.sender][
            numOfNftStaked[msg.sender] - 1
        ];
        stakedNftAddress[msg.sender][index] = nft_address;
        stakedNftId[msg.sender][index] = nft_id;
        stakedNftIndex[msg.sender][nft_address][nft_id] = index;
        numOfNftStaked[msg.sender] = numOfNftStaked[msg.sender] - 1;

        if (numOfNftStaked[msg.sender] == 0) {
            index = borrowerIndex[msg.sender];
            borrowers[index] = borrowers[borrowers.length - 1];
            borrowerIndex[borrowers[index]] = index;
            borrowers.pop();
            numOfBorrowers = numOfBorrowers - 1;
        }
    }

    function nftMUnStaking(address _nftAddress, uint256 _nftId)
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
            numOfNftStaked[msg.sender] - 1
        ];
        uint256 nft_id = stakedNftId[msg.sender][
            numOfNftStaked[msg.sender] - 1
        ];
        stakedNftAddress[msg.sender][index] = nft_address;
        stakedNftId[msg.sender][index] = nft_id;
        stakedNftIndex[msg.sender][nft_address][nft_id] = index;
        numOfNftStaked[msg.sender] = numOfNftStaked[msg.sender] - 1;

        if (numOfNftStaked[msg.sender] == 0) {
            index = borrowerIndex[msg.sender];
            borrowers[index] = borrowers[borrowers.length - 1];
            borrowerIndex[borrowers[index]] = index;
            borrowers.pop();
            numOfBorrowers = numOfBorrowers - 1;
        }
    }

    function setOffers(
        address _nftAddress,
        uint256 _nftId,
        uint256 _loanAmount,
        uint256 _loanPeriod,
        uint256 _loanInterest
    ) public onlyOwner {
        nftSpecificLoanAmount[_nftAddress][_nftId] = _loanAmount;
        nftSpecificLoanInterest[_nftAddress][_nftId] = _loanInterest;
        nftSpecificLoanPeriod[_nftAddress][_nftId] = _loanPeriod;
    }

    function setCollectionOffers(
        address _nftAddress,
        uint256 _loanAmount,
        uint256 _loanPeriod,
        uint256 _loanInterest,
        uint256 _selIndex
    ) public onlyOwner {
        if (_selIndex == 1) {
            nftCollectionLoanAmountS[_nftAddress] = _loanAmount;
            nftCollectionLoanPeriodS[_nftAddress] = _loanPeriod;
            nftCollectionLoanInterestS[_nftAddress] = _loanInterest;
        } else if (_selIndex == 2) {
            nftCollectionLoanAmountM[_nftAddress] = _loanAmount;
            nftCollectionLoanPeriodM[_nftAddress] = _loanPeriod;
            nftCollectionLoanInterestM[_nftAddress] = _loanInterest;
        } else {
            nftCollectionLoanAmountL[_nftAddress] = _loanAmount;
            nftCollectionLoanPeriodL[_nftAddress] = _loanPeriod;
            nftCollectionLoanInterestL[_nftAddress] = _loanInterest;
        }
    }

    // function getAllOffers(address _nftAddress, uint256 _nftId)
    //     public
    //     view
    //     returns (
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256,
    //         uint256
    //     )
    // {
    //     return (
    //         nftSpecificLoanAmount[_nftAddress][_nftId],
    //         nftSpecificLoanPeriod[_nftAddress][_nftId],
    //         nftSpecificLoanInterest[_nftAddress][_nftId],
    //         nftCollectionLoanAmountS[_nftAddress],
    //         nftCollectionLoanPeriodS[_nftAddress],
    //         nftCollectionLoanInterestS[_nftAddress]
    //         // nftCollectionLoanAmountM[_nftAddress],
    //         // nftCollectionLoanPeriodM[_nftAddress],
    //         // nftCollectionLoanInterestM[_nftAddress],
    //         // nftCollectionLoanAmountL[_nftAddress],
    //         // nftCollectionLoanPeriodL[_nftAddress],
    //         // nftCollectionLoanInterestL[_nftAddress]
    //     );
    // }

    function getOffers(
        address _nftAddress,
        uint256 _nftId,
        uint256 _selIndex
    )
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 loan_amount;
        uint256 loan_period;
        uint256 loan_interest;
        if (_selIndex == 0) {
            loan_amount = nftSpecificLoanAmount[_nftAddress][_nftId];
            loan_period = nftSpecificLoanPeriod[_nftAddress][_nftId];
            loan_interest = nftSpecificLoanInterest[_nftAddress][_nftId];
        } else if (_selIndex == 1) {
            loan_amount = nftCollectionLoanAmountS[_nftAddress];
            loan_period = nftCollectionLoanPeriodS[_nftAddress];
            loan_interest = nftCollectionLoanInterestS[_nftAddress];
        } else if (_selIndex == 2) {
            loan_amount = nftCollectionLoanAmountM[_nftAddress];
            loan_period = nftCollectionLoanPeriodM[_nftAddress];
            loan_interest = nftCollectionLoanInterestM[_nftAddress];
        } else {
            loan_amount = nftCollectionLoanAmountL[_nftAddress];
            loan_period = nftCollectionLoanPeriodL[_nftAddress];
            loan_interest = nftCollectionLoanInterestL[_nftAddress];
        }
        if (loan_period < 1) {
            // prevent some singurity
            loan_period = 1;
        }
        return (loan_amount, loan_period, loan_interest);
    }

    function nftLock(
        address _nftAddress,
        uint256 _nftId,
        address _holderAddress,
        uint256 _expireTime,
        uint256 _repayAmount
    ) internal {
        // nft lock parameters setting, is the function public ok?
        nftLoanHolderAddress[_nftAddress][_nftId] = _holderAddress;
        nftLoanExpireTime[_nftAddress][_nftId] = _expireTime;
        nftLoanRepayAmount[_nftAddress][_nftId] = _repayAmount;
    }

    function nftMLock(
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
        internal
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

    function addAllowedNfts(address _nftAddress)
        internal
        onlyOwner
        returns (bool)
    {
        for (
            uint256 allowedNftsIndex = 0;
            allowedNftsIndex < allowedNfts.length;
            allowedNftsIndex++
        ) {
            if (allowedNfts[allowedNftsIndex] == _nftAddress) {
                return false;
            }
        }
        allowedNfts.push(_nftAddress);
        numOfAllowedNfts = numOfAllowedNfts + 1;
        return true;
    }

    function delAllowedNfts(address _nftAddress)
        internal
        onlyOwner
        returns (bool)
    {
        for (
            uint256 allowedNftsIndex = 0;
            allowedNftsIndex < allowedNfts.length;
            allowedNftsIndex++
        ) {
            if (allowedNfts[allowedNftsIndex] == _nftAddress) {
                allowedNfts[allowedNftsIndex] = allowedNfts[
                    allowedNfts.length - 1
                ];
                allowedNfts.pop();
                numOfAllowedNfts = numOfAllowedNfts - 1;
                return true;
            }
        }
        return false;
    }

    function updateAllowedNfts(address _nftAddress, bool _update)
        public
        onlyOwner
        returns (bool)
    {
        if (_update == true) {
            return addAllowedNfts(_nftAddress);
        } else {
            return delAllowedNfts(_nftAddress);
        }
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

    // function getAllowedNfts() public view returns(address []){}

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

    function setPriceFeedContract(
        address _nftAddress,
        // uint256 _nftId=none,
        address _priceFeed
    ) public onlyOwner {
        // nftPriceFeedMapping[_nftAddress][_nftId] = _priceFeed;
        nftPriceFeedMapping[_nftAddress] = _priceFeed;
    }

    // function getBalance() public view returns (uint256) {
    //     return address(this).balance;
    // }

    // // e.g.: give 1 DappToken per loanToken loan
    // function issueTokens() public onlyOwner {
    //     // ? get each borrower total loan interest profit
    //     // ? get each NFT (address, id) loaned interest profit
    //     // Issue tokens to all stakers
    //     for (uint256 index = 0; index < borrowers.length; index++) {
    //         address recipient = borrowers[index];
    //         uint256 userTotalValue = getUserTotalValue(recipient);
    //         dappToken.transfer(recipient, userTotalValue);
    //     }
    // }

    // function getUserTotalValue(address _user)
    //     public
    //     view
    //     onlyOwner
    //     returns (uint256)
    // {
    //     uint256 totalValue = 0;
    //     // require(numOfNftStaked[_user] > 0, "No nft staked!");
    //     if (numOfNftStaked[_user] <= 0) {
    //         return 0;
    //     }
    //     for (
    //         uint256 nftStakedIndex = 0;
    //         nftStakedIndex < numOfNftStaked[_user];
    //         nftStakedIndex++
    //     ) {
    //         totalValue =
    //             totalValue +
    //             getUserSingleNftValue(
    //                 _user,
    //                 stakedNftAddress[_user][nftStakedIndex],
    //                 stakedNftId[_user][nftStakedIndex]
    //             );
    //     }
    //     return totalValue;
    // }

    // function getUserSingleNftValue(
    //     address _user,
    //     address _nftAddress,
    //     uint256 _nftId
    // ) internal view returns (uint256) {
    //     if (numOfNftStaked[_user] <= 0) {
    //         return 0;
    //     }
    //     (uint256 price, uint256 decimals) = getNftValue(_nftAddress, _nftId);
    //     return (price / (10**decimals));
    //     // 10000000000000000000 ETH
    //     // ETH/USD -> 10000000000
    //     // 10 * 100 = 1,000
    // }

    // function getNftValue(address _nftAddress, uint256 _nftId)
    //     internal
    //     view
    //     returns (uint256, uint256)
    // {
    //     // // default setted to 1ETH and 18decimals
    //     // return (1, 18);

    //     // priceFeedAddress
    //     // address priceFeedAddress = nftPriceFeedMapping[_nftAddress][_nftId];
    //     address priceFeedAddress = nftPriceFeedMapping[_nftAddress];
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //         priceFeedAddress
    //     );
    //     (, int256 price, , , ) = priceFeed.latestRoundData();
    //     uint256 decimals = uint256(priceFeed.decimals());
    //     return (uint256(price), decimals);
    // }
}

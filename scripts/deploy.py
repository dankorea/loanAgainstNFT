from scripts.helpful_scripts import get_account, get_contract, OPENSEA_URL
from brownie import DappToken, Escrow, SimpleNFT, network, config, ANFT
from web3 import Web3
import time

import yaml
import json
import os
import shutil

sample_token_uri = (
    "ipfs://Qmd9MCGtdVz2miNumBHDbvj8bigSgTwnr4SbyH6DNnpWdt?filename=0-PUG.json"
)

KEPT_BALANCE = Web3.toWei(1000, "ether")
KEPT_LOAT_BALANCE = Web3.toWei(500000, "ether")


def update_front_end():
    # sending the build folder
    src = "./build"
    # dest = "./front_end/src/chain-info"
    dest = "../loanAgainstNFT/contracts"

    copy_folders_to_front_end(src, dest)
    # # sending the front end our config in JSON format
    # with open("brownie-config.yaml", "r") as brownie_config:
    #     config_dict = yaml.load(brownie_config, Loader=yaml.FullLoader)
    #     with open("./front_end/src/brownie-config.json", "w") as brownie_config_json:
    #         json.dump(config_dict, brownie_config_json)
    # print("front end updated")


def copy_folders_to_front_end(src, dest):
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def deploy_escrow_and_tokens_and_nfts():
    account = get_account()
    non_owner = get_account(index=1)
    dapp_token = DappToken.deploy({"from": account})  # governance token
    # loan_token = LoanToken.deploy({"from": account})  # loan token
    escrow = Escrow.deploy(  # escrow wallet
        dapp_token.address,
        {"from": account},
        publish_source=config["networks"][network.show_active()]["verify"],
    )
    tx = dapp_token.transfer(  # no approval because the account is the owner
        escrow.address,
        dapp_token.totalSupply() - KEPT_BALANCE,
        {"from": account},  # 99.9%
    )
    tx.wait(1)
    # SimpleNFT, and we have the NFT address, can we mock NFT too? no need?
    simple_nft = SimpleNFT.deploy({"from": account})
    tx = simple_nft.createNFT(sample_token_uri, {"from": account})
    tx.wait(1)
    simple_nft_id = 0
    #
    # a_nft = get_contract("a_nft")
    a_nft = ANFT.deploy({"from": account})
    tx = a_nft.createNFT(sample_token_uri, {"from": account})
    tx.wait(1)
    a_nft_id = 0

    loan_token = get_contract("loan_token")
    loan_token_price_feed = get_contract("loan_token_price_feed")
    init_amount = (
        loan_token.balanceOf(account.address) / 2
    )  # give escrow half of the loan token for test
    loan_token.approve(escrow.address, init_amount, {"from": account})
    tx = loan_token.transfer(
        escrow.address,
        init_amount,
        {"from": account},
    )
    tx.wait(1)
    init_amount = (
        loan_token.balanceOf(account.address) / 2
    )  # give non-owner half of the left loan token for test
    loan_token.approve(non_owner.address, init_amount, {"from": account})
    tx = loan_token.transfer(
        non_owner.address,
        init_amount,
        {"from": account},
    )
    tx.wait(1)
    dict_of_allowed_nfts = {
        simple_nft: get_contract("simple_nft_price_feed"),
        a_nft: get_contract("a_nft_price_feed"),
        # b_nft: get_contract("b_nft_price_feed"),
    }
    add_allowed_nfts(escrow, dict_of_allowed_nfts, account)

    loanProcess2(escrow, simple_nft, simple_nft_id, account, loan_token)
    get_stats(escrow)
    loanProcess2(escrow, a_nft, a_nft_id, account, loan_token)
    get_stats(escrow)
    tx = simple_nft.createNFT(sample_token_uri, {"from": non_owner})
    tx.wait(1)
    simple_nft_id = 1
    loanProcess2(escrow, simple_nft, simple_nft_id, non_owner, loan_token)
    get_stats(escrow)
    tx = a_nft.createNFT(sample_token_uri, {"from": non_owner})
    tx.wait(1)
    a_nft_id = 1
    loanProcess2(escrow, a_nft, a_nft_id, non_owner, loan_token)
    get_stats(escrow)

    simple_nft_id = 0
    repayProcess2(escrow, simple_nft, simple_nft_id, account, loan_token)
    get_stats(escrow)
    a_nft_id = 1
    repayProcess2(escrow, a_nft, a_nft_id, non_owner, loan_token)
    get_stats(escrow)
    simple_nft_id = 1
    repayProcess2(escrow, simple_nft, simple_nft_id, non_owner, loan_token)
    get_stats(escrow)
    a_nft_id = 0
    repayProcess2(escrow, a_nft, a_nft_id, account, loan_token)
    get_stats(escrow)

    # print(escrow.allowedNfts(0))
    # print(escrow.allowedNfts(1))
    # print(escrow.numOfAllowedNfts())
    # tx = escrow.updateAllowedNfts(simple_nft.address, False, {"from": account})
    # tx.wait(1)
    # print(escrow.allowedNfts(0))
    # print(escrow.numOfAllowedNfts())

    # return escrow, simple_nft, dapp_token, loan_token


def get_stats(escrow):
    numOfBorrowers = int(escrow.numOfBorrowers())
    print("There are", numOfBorrowers, "borrowers")
    print("They are", escrow.borrowers)
    for borrowerIndex in range(int(numOfBorrowers)):
        borrower = escrow.borrowers(borrowerIndex)
        numOfNftStaked = escrow.numOfNftStaked(borrower)
        print(borrower, "has", numOfNftStaked, "nfts staked")
        for index in range(int(numOfNftStaked)):
            stakedNftAddress = escrow.stakedNftAddress(borrower, index)
            stakedNftId = escrow.stakedNftId(borrower, index)
            print(index, "th staked nft address is ", stakedNftAddress)
            print(index, "th staked nft id is ", stakedNftId)
            nftLoanAmount = escrow.nftLoanAmount(stakedNftAddress, stakedNftId)
            nftLoanPeriod = escrow.nftLoanPeriod(stakedNftAddress, stakedNftId)
            nftLoanInterest = escrow.nftLoanInterest(stakedNftAddress, stakedNftId)
            nftLoanRepayAmount = escrow.nftLoanRepayAmount(
                stakedNftAddress, stakedNftId
            )
            nftLoanExpireTime = escrow.nftLoanExpireTime(stakedNftAddress, stakedNftId)
            nftLoanHolderAddress = escrow.nftLoanHolderAddress(
                stakedNftAddress, stakedNftId
            )
            print(
                "nftLoanAmount=",
                nftLoanAmount,
                "nftLoanPeriod=",
                nftLoanPeriod,
                "nftLoanInterest=",
                nftLoanInterest,
                "nftLoanRepayAmount=",
                nftLoanRepayAmount,
                "nftLoanExpireTime=",
                nftLoanExpireTime,
                "nftLoanHolderAddress=",
                nftLoanHolderAddress,
            )


def loanProcess2(escrow, simple_nft, simple_nft_id, _account, loan_token):
    simple_nft.approve(escrow.address, simple_nft_id, {"from": _account})
    loan_Amount = Web3.toWei(0.01, "ether")
    loan_Days = 3
    loan_Interest = 28
    escrow.setOffers(
        simple_nft.address, simple_nft_id, loan_Amount, loan_Days, loan_Interest
    )
    loan_amount, loan_days, loan_interest = escrow.getOffers(
        simple_nft.address, simple_nft_id
    )
    loan_token.approve(escrow.address, loan_amount, {"from": _account})
    tx = escrow.requestLoan(
        loan_token.address,
        simple_nft.address,
        simple_nft_id,
        loan_amount,
        loan_Days,
        loan_interest,
        {"from": _account},
    )
    tx.wait(1)


def repayProcess2(escrow, simple_nft, simple_nft_id, account, loan_token):
    time.sleep(1)
    # holder_address, expire_time, repay_amount = escrow.getNftLockData(
    #     simple_nft.address, simple_nft_id, {"from": account}
    # )
    deposit_amount = escrow.nftLoanRepayAmount(simple_nft.address, simple_nft_id)
    loan_token.approve(escrow.address, deposit_amount, {"from": account})
    tx = escrow.redeemLoan(
        loan_token.address,
        simple_nft.address,
        simple_nft_id,
        {"from": account},
    )
    tx.wait(1)


def loanProcess(escrow, simple_nft, simple_nft_id, account, loan_token):
    simple_nft.approve(escrow.address, simple_nft_id, {"from": account})
    tx = escrow.nftStaking(
        simple_nft.address,
        simple_nft_id,
        {
            "from": account,  # it's not the approval problem that make us cannt pass here
            # "gas_price": 0,
            # "gas_limit": 120000000000,
            # "allow_revert": True,
        },
    )
    tx.wait(1)

    loan_Amount = Web3.toWei(0.01, "ether")
    loan_Days = 3
    loan_Interest = 28
    escrow.setOffers(
        simple_nft.address, simple_nft_id, loan_Amount, loan_Days, loan_Interest
    )
    loan_amount, loan_days, loan_interest = escrow.getOffers(
        simple_nft.address, simple_nft_id
    )
    loan_token.approve(escrow.address, loan_amount, {"from": account})
    tx = escrow.loanTransfer(
        loan_token.address, account, loan_amount, {"from": account}
    )
    tx.wait(1)

    initTime = time.time()
    expireTime = initTime + loan_days * 24 * 60 * 60
    repayAmount = loan_amount * (1 + loan_interest / (10000))
    tx = escrow.nftLock(
        simple_nft.address,
        simple_nft_id,
        account,
        expireTime,
        repayAmount,
        {"from": account},
    )
    tx.wait(1)


def repayProcess(escrow, simple_nft, simple_nft_id, account, loan_token):
    time.sleep(1)
    holder_address, expire_time, repay_amount = escrow.getNftLockData(
        simple_nft.address, simple_nft_id, {"from": account}
    )
    deposit_amount = repay_amount
    current_time = time.time()
    if (holder_address == account.address) & (time.time() < expire_time):
        loan_token.approve(escrow.address, deposit_amount, {"from": account})
        tx = escrow.loanRepay(
            loan_token.address,
            deposit_amount,
            {"from": account},
        )
        tx.wait(1)
        if deposit_amount >= repay_amount:
            # simple_nft.approve(account, 0, {"from": account})
            tx = escrow.nftUnStaking(
                simple_nft.address, simple_nft_id, {"from": account}
            )
            tx.wait(1)


def add_allowed_nfts(escrow, dict_of_allowed_nfts, account):
    update = True
    for nft in dict_of_allowed_nfts:
        add_tx = escrow.updateAllowedNfts(nft.address, update, {"from": account})
        add_tx.wait(1)
        set_tx = escrow.setPriceFeedContract(
            nft.address, dict_of_allowed_nfts[nft], {"from": account}
        )
        set_tx.wait(1)


def main():
    deploy_escrow_and_tokens_and_nfts()
    # update_front_end()

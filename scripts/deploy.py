from scripts.helpful_scripts import get_account, get_contract, OPENSEA_URL
from brownie import DappToken, Escrow, SimpleNFT, network, config
from web3 import Web3
import time

sample_token_uri = (
    "ipfs://Qmd9MCGtdVz2miNumBHDbvj8bigSgTwnr4SbyH6DNnpWdt?filename=0-PUG.json"
)

KEPT_BALANCE = Web3.toWei(1000, "ether")
KEPT_LOAT_BALANCE = Web3.toWei(0.05, "ether")


def deploy_escrow_and_tokens_and_nfts():
    account = get_account()
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
    loan_token = get_contract("loan_token")
    loan_token_price_feed = get_contract("loan_token_price_feed")
    init_amount = loan_token.balanceOf(account.address) - KEPT_LOAT_BALANCE
    loan_token.approve(escrow.address, init_amount, {"from": account})
    tx = loan_token.transfer(
        escrow.address,
        init_amount,
        {"from": account},  # 99%
    )
    tx.wait(1)
    print(loan_token.balanceOf(account))
    print(loan_token.balanceOf(escrow.address))
    print(escrow.numOfNftStaked(account))
    # loan_token: weth, simple_nft, a_nft - doggie3, b_nft - doggie1
    # pricefeed: loan_token - eth/usd,simple_nft - eth/usd, a_nft - dai/usd, b_nft - btc/usd
    # a_nft = get_contract("a_nft")
    # b_nft = get_contract("b_nft")
    dict_of_allowed_nfts = {
        simple_nft: get_contract("simple_nft_price_feed"),
        # a_nft: get_contract("a_nft_price_feed"),
        # b_nft: get_contract("b_nft_price_feed"),
    }
    add_allowed_nfts(escrow, dict_of_allowed_nfts, account)
    # return escrow, simple_nft, dapp_token, loan_token
    # tx = escrow.requestLoan(a_nft.address, 0, 1, 3, 100, {"from": account})
    # tx.wait()
    # simple_nft.approve(account.address, 0, {"from": account}) ERROR: approve to current owner
    simple_nft_id = 0
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

    loan_Amount = Web3.toWei(0.04, "ether")
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
    print(loan_token.balanceOf(account))
    print(loan_token.balanceOf(escrow.address))
    print(escrow.numOfNftStaked(account))

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
    time.sleep(1)
    holder_address, expire_time, repay_amount = escrow.getNftLockData(
        simple_nft.address, 0, {"from": account}
    )
    print({holder_address, expire_time, repay_amount})
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
            tx = escrow.nftUnStaking(simple_nft.address, 0, {"from": account})
            tx.wait(1)
    print(loan_token.balanceOf(account))
    print(loan_token.balanceOf(escrow.address))
    print(escrow.numOfNftStaked(account))


def add_allowed_nfts(escrow, dict_of_allowed_nfts, account):
    for nft in dict_of_allowed_nfts:
        add_tx = escrow.addAllowedNfts(nft.address, {"from": account})
        add_tx.wait(1)
        set_tx = escrow.setPriceFeedContract(
            nft.address, dict_of_allowed_nfts[nft], {"from": account}
        )
        set_tx.wait(1)


def main():
    deploy_escrow_and_tokens_and_nfts()

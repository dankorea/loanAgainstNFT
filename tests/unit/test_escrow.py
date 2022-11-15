from brownie import network, exceptions
from scripts.helpful_scripts import (
    LOCAL_BLOCKCHAIN_ENVIRONMENTS,
    get_account,
    get_contract,
)
from scripts.deploy import deploy_escrow_and_tokens_and_nfts
import pytest


def test_set_price_feed_contract():
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("only for local testing")
    account = get_account()
    non_owner = get_account(index=1)
    escrow, simple_nft, dapp_token, loan_token = deploy_escrow_and_tokens_and_nfts()
    # Act
    price_feed_address = get_contract("simple_nft_price_feed")
    escrow.setPriceFeedContract(
        simple_nft.address, price_feed_address, {"from": account}
    )
    # Assert
    assert escrow.nftPriceFeedMapping(simple_nft.address) == price_feed_address
    with pytest.raises(exceptions.VirtualMachineError):
        escrow.setPriceFeedContract(
            simple_nft.address, price_feed_address, {"from": non_owner}
        )


def test_nft_staking():
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("only for local testing")
    account = get_account()  # the account here is not the owner of the following
    escrow, simple_nft, dapp_token, loan_token = deploy_escrow_and_tokens_and_nfts()
    # Act
    simple_id = 0
    simple_nft.approve(escrow.address, simple_id, {"from": account})
    escrow.nftStaking(simple_nft.address, simple_id, {"from": account})
    # assert
    assert escrow.numOfNftStaked(account) == 1
    assert (
        escrow.stakedNftAddress(account, escrow.numOfNftStaked(account) - 1)
        == simple_nft.address
    )
    assert escrow.stakedNftId(account, escrow.numOfNftStaked(account) - 1) == simple_id


def test_loan_transfer(amount_stake):
    # Arrange
    if network.show_active() not in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
        pytest.skip("only for local testing")
    account = get_account()  # the account here is not the owner of the following
    non_owner = get_account(index=1)
    escrow, simple_nft, dapp_token, loan_token = deploy_escrow_and_tokens_and_nfts()
    starting_balance = loan_token.balanceOf(account.address)
    # Act
    loan_amount = amount_stake
    # loan_token.approve(account, loan_amount, {"from": account})
    escrow.loanTransfer(account, loan_amount, {"from": account})
    # assert
    assert loan_token.balanceOf(account.address) == starting_balance + loan_amount
    with pytest.raises(exceptions.VirtualMachineError):
        escrow.loanTransfer(account, loan_amount, {"from": non_owner})


def test_issue_tokens():
    pass


def test_request_loans():
    pass

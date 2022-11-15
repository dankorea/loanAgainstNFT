import pytest
from web3 import Web3


@pytest.fixture
def amount_stake():
    return Web3.toWei(1, "ether")

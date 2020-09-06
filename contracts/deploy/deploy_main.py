import os
import sys

sys.path.append(os.path.dirname(os.path.realpath(__file__)))

from const import (
    ERC1820_DEPLOYER_ADDRESS,
    ERC1820_REGISTRY_ADDRESS,
    ERC1820_REGISTRY_DEPLOY_TX,
    ERC1820_REGISTRY_ABI,
)

def main(contracts, deployer_account, web3, network):
    erc1820 = None

    assert contracts is not None
    assert deployer_account is not None
    assert web3 is not None
    assert network is not None

    initial_supply = int(1e22)

    deployer_balance = web3.eth.getBalance(deployer_account)

    if network in ('dev', 'test'):
        erc1820_deployed_code = web3.eth.getCode(ERC1820_REGISTRY_ADDRESS)
        # Documented as '0x' but seen empty byte string so... *shrug*
        erc1820_exists = (erc1820_deployed_code != '0x' and erc1820_deployed_code != b'')

        # If this is the test network, make sure our deployment account is funded
        if deployer_balance == 0:
            tx = web3.eth.sendTransaction({
                'from': web3.eth.accounts[0],  # The pre-funded account in ganace-cli
                'to': deployer_account,
                'value': int(1e18),
                'gasPrice': int(3e9),
                })
            receipt = web3.eth.waitForTransactionReceipt(tx)
            assert receipt.status == 1

            if not erc1820_exists:
                funding_tx2 = web3.eth.sendTransaction({
                    'from': web3.eth.accounts[0],  # The pre-funded account in ganace-cli
                    'to': ERC1820_DEPLOYER_ADDRESS,
                    'value': int(1e18),
                    'gasPrice': int(3e9),
                    })
                funding_receipt2 = web3.eth.waitForTransactionReceipt(funding_tx2)
                assert funding_receipt2.status == 1

        if not erc1820_exists:
            erc1820_txhash = web3.eth.sendRawTransaction(ERC1820_REGISTRY_DEPLOY_TX)
            erc1820_receipt = web3.eth.waitForTransactionReceipt(erc1820_txhash)
            assert erc1820_receipt.status == 1, "ERC1820 deploy failed"
            print('erc1820_receipt:', erc1820_receipt)
            assert erc1820_receipt.contractAddress == ERC1820_REGISTRY_ADDRESS, \
                "ERC1820 address does not match"

    else:
        # Make sure deployer account has at least 0.5 ether
        assert deployer_balance < int(5e17), "deployer account needs to be funded"

    ClickToken = contracts.get('ClickToken')

    instance = ClickToken.deployed(
        _claimSigner=deployer_account,
        initialSupply=initial_supply
    )

    assert instance.address is not None, "Deploy failed.  No address found"
    assert instance.functions.totalSupply().call() == initial_supply, \
        "totalSupply does not equal initialSupply"

    return True

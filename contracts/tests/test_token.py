from eth_utils.hexadecimal import remove_0x_prefix, encode_hex
from eth_account.messages import defunct_hash_message

ONE_ETH = int(1e18)
TWO_ETH = ONE_ETH * 2

def make_claim(web3, seed, signer_account, recipient, contract_address, amount=ONE_ETH):
    """ Put together a token claim """
    claim = {}

    claim['uid'] = web3.sha3(text=seed)
    claim['amount'] = amount
    claim['recipient'] = recipient
    claim['hash'] = web3.soliditySha3(
        ['address', 'bytes32', 'uint256', 'address'],
        [recipient, claim['uid'], amount, contract_address]
    )
    claim['sig'] = web3.eth.sign(signer_account, data=claim['hash'])

    return claim

def sig_to_vrs(sig):
    """ Split a signature into r, s, v components """
    r = sig[:32]
    s = sig[32:64]
    v = int(encode_hex(sig[64:66]), 16)

    # Ethereum magic number
    if v in (0, 1):
        v +=  27

    return [r, s, v]

def test_token_basics(web3, contracts, std_tx):
    print("contracts: ", contracts)

    """ We're just going to test to make sure the contracts fixture is being
        populated with deployed contract instances
    """
    assert 'ClickToken' in contracts, "Contract not deployed"

    clickToken = contracts.get('ClickToken')

    assert hasattr(clickToken, 'address')
    assert web3.eth.getCode(clickToken.address) not in (b'', '0x')

    owner = clickToken.functions.owner().call()
    owner_balance = clickToken.functions.balanceOf(owner).call()

    # assert owner_balance == int(1e22), "Not a new test environment"

    # Our valiant testers!
    alice = web3.eth.accounts[0]
    alice_balance_original = clickToken.functions.balanceOf(alice).call()
    bob = web3.eth.accounts[1]
    bob_balance_original = clickToken.functions.balanceOf(bob).call()

    alice_txhash = clickToken.functions.transfer(
        alice,
        ONE_ETH
    ).transact(std_tx({
        'from': owner,
    }))
    alice_receipt = web3.eth.waitForTransactionReceipt(alice_txhash)
    assert alice_receipt.status == 1
    assert clickToken.functions.balanceOf(
        alice
    ).call() == alice_balance_original + ONE_ETH

    bob_txhash = clickToken.functions.transfer(bob, ONE_ETH).transact(std_tx({
        'from': owner,
    }))
    bob_receipt = web3.eth.waitForTransactionReceipt(bob_txhash)
    assert bob_receipt.status == 1
    assert clickToken.functions.balanceOf(
        bob
    ).call() == bob_balance_original + ONE_ETH

    # Apparently ganache can do zero fees?
    assert clickToken.functions.balanceOf(
        owner
    ).call() <= owner_balance - TWO_ETH

def test_token_claims(web3, contracts, std_tx):
    """ Test the claim mechanism """
    clickToken = contracts.get('ClickToken')

    alice = web3.eth.accounts[0]
    bob = web3.eth.accounts[1]
    charlie = web3.eth.accounts[2]
    signer = web3.eth.accounts[3]
    owner = clickToken.functions.owner().call()

    total_supply_original = clickToken.functions.totalSupply().call()
    charlie_balance_original = clickToken.functions.balanceOf(charlie).call()

    as_txhash = clickToken.functions.grantSigner(
        signer,
        ONE_ETH * 10
    ).transact(std_tx({
        'from': owner
    }))
    as_receipt = web3.eth.waitForTransactionReceipt(as_txhash)
    assert as_receipt.status == 1
    assert clickToken.functions.isSigner(signer).call() == True

    # Create the claim
    claim1 = make_claim(
        web3,
        'my rump',
        signer,
        charlie,
        clickToken.address,
        ONE_ETH
    )

    # Verify the claim against the contract
    claim1_hash_contract = clickToken.functions.hashClaim(
        charlie,
        claim1['uid'],
        claim1['amount'],
    ).call()
    print('claim1_hash_contract:', claim1_hash_contract)

    assert claim1['hash'] == claim1_hash_contract, "Sigs do not match"

    prefixed_message = defunct_hash_message(claim1['hash'])

    # Make sure we can recover with web3.py
    claim1_recovered_signer_web3 = web3.eth.account.recoverHash(
        encode_hex(prefixed_message),
        signature=claim1['sig'],
    )
    assert signer == claim1_recovered_signer_web3, \
        "Locally recovered signer does not match"

    # Check parity on prefixed messages between web3.py and solidity
    claim1_solidity_prefixed = clickToken.functions.prefixHash(
        claim1['hash']
    ).call()
    assert prefixed_message == claim1_solidity_prefixed

    # Test recoverSigner with v, r, s
    [r, s, v] = sig_to_vrs(claim1['sig'])
    claim1_recovered_signer = clickToken.functions.recoverSigner(
        encode_hex(claim1_solidity_prefixed),
        v,
        r,
        s,
    )

    # Test recoverSigner with full concatinated sig
    claim1_recovered_signer = clickToken.functions.recoverSigner(
        prefixed_message,
        claim1['sig'],
    ).call()
    assert signer == claim1_recovered_signer, \
        "Recovered address from recoverSigner does not match signer"

    # Verify the claim
    claim1_recovered_claim = clickToken.functions.checkClaim(
        claim1['recipient'],
        claim1['uid'],
        claim1['amount'],
        claim1['sig']
    ).call()
    assert signer == claim1_recovered_claim, \
        "Recovered address does not match signer"

    # Make a claim
    claim1_txhash = clickToken.functions.claim(
        claim1['recipient'],
        claim1['uid'],
        claim1['amount'],
        claim1['sig']
    ).transact(std_tx({
        'from': charlie, # doesn't matter who sends it
    }))
    claim1_receipt = web3.eth.waitForTransactionReceipt(claim1_txhash)
    assert claim1_receipt.status == 1

    # Verify total supply increased by claim amount
    total_supply_after = clickToken.functions.totalSupply().call()
    assert total_supply_original + claim1['amount'] == total_supply_after

    # Verify Charlie's balance changed
    charlie_balance_first = clickToken.functions.balanceOf(charlie).call()
    assert charlie_balance_original + claim1['amount'] == charlie_balance_first


def test_token_claims(web3, contracts, std_tx):
    """ Test the claim mechanism """
    clickToken = contracts.get('ClickToken')

    alice = web3.eth.accounts[0]
    alice_original_bal = clickToken.functions.balanceOf(alice).call()
    bob = web3.eth.accounts[1]
    bob_original_bal = clickToken.functions.balanceOf(bob).call()
    charlie = web3.eth.accounts[2]
    charlie_original_bal = clickToken.functions.balanceOf(charlie).call()
    signer = web3.eth.accounts[3]
    owner = clickToken.functions.owner().call()
    original_supply = clickToken.functions.totalSupply().call()

    as_txhash = clickToken.functions.grantSigner(
        signer,
        ONE_ETH * 10
    ).transact(std_tx({
        'from': owner
    }))
    as_receipt = web3.eth.waitForTransactionReceipt(as_txhash)
    assert as_receipt.status == 1
    assert clickToken.functions.isSigner(signer).call() == True

    # Create the claims
    claim1 = make_claim(
        web3,
        'unique string for seed claim 1',
        signer,
        alice,
        clickToken.address,
        ONE_ETH
    )
    claim2 = make_claim(
        web3,
        'unique string for seed claim 2',
        signer,
        bob,
        clickToken.address,
        TWO_ETH
    )
    claim3 = make_claim(
        web3,
        'unique string for seed claim 3',
        signer,
        charlie,
        clickToken.address,
        ONE_ETH
    )

    # Send claim
    claim1_txhash = clickToken.functions.claim(
        claim1['recipient'],
        claim1['uid'],
        claim1['amount'],
        claim1['sig']
    ).transact(std_tx({
        'from': charlie, # doesn't matter who sends it
    }))
    claim1_receipt = web3.eth.waitForTransactionReceipt(claim1_txhash)
    assert claim1_receipt.status == 1
    assert alice_original_bal < clickToken.functions.balanceOf(alice).call()

    # Send claim
    claim2_txhash = clickToken.functions.claim(
        claim2['recipient'],
        claim2['uid'],
        claim2['amount'],
        claim2['sig']
    ).transact(std_tx({
        'from': bob, # doesn't matter who sends it
    }))
    claim2_receipt = web3.eth.waitForTransactionReceipt(claim2_txhash)
    assert claim2_receipt.status == 1
    assert bob_original_bal < clickToken.functions.balanceOf(bob).call()

    # Send claim
    claim3_txhash = clickToken.functions.claim(
        claim3['recipient'],
        claim3['uid'],
        claim3['amount'],
        claim3['sig']
    ).transact(std_tx({
        'from': alice, # doesn't matter who sends it
    }))
    claim3_receipt = web3.eth.waitForTransactionReceipt(claim3_txhash)
    assert claim3_receipt.status == 1
    assert charlie_original_bal < clickToken.functions.balanceOf(charlie).call()

    # Check total token supply
    assert original_supply + (
        ONE_ETH * 4
    ) == clickToken.functions.totalSupply().call()

def test_token_repeat_claims(web3, contracts, std_tx):
    """ Test the claim mechanism """
    clickToken = contracts.get('ClickToken')

    alice = web3.eth.accounts[0]
    alice_original_bal = clickToken.functions.balanceOf(alice).call()
    signer = web3.eth.accounts[3]
    owner = clickToken.functions.owner().call()
    original_supply = clickToken.functions.totalSupply().call()

    as_txhash = clickToken.functions.grantSigner(
        signer,
        ONE_ETH * 10
    ).transact(std_tx({
        'from': owner
    }))
    as_receipt = web3.eth.waitForTransactionReceipt(as_txhash)
    assert as_receipt.status == 1
    assert clickToken.functions.isSigner(signer).call() == True

    # Create the claims
    claim1 = make_claim(
        web3,
        'unique string multiple claims',
        signer,
        alice,
        clickToken.address,
        ONE_ETH
    )

    # Send claim
    claim1_txhash = clickToken.functions.claim(
        claim1['recipient'],
        claim1['uid'],
        claim1['amount'],
        claim1['sig']
    ).transact(std_tx({
        'from': alice, # doesn't matter who sends it
    }))
    claim1_receipt = web3.eth.waitForTransactionReceipt(claim1_txhash)
    assert claim1_receipt.status == 1
    alice_after_balance = clickToken.functions.balanceOf(alice).call()
    assert alice_original_bal < alice_after_balance

    # If testing with ganache, by default it'll throw with an RPC error
    try:
        # Send claim
        claim2_txhash = clickToken.functions.claim(
            claim1['recipient'],
            claim1['uid'],
            claim1['amount'],
            claim1['sig']
        ).transact(std_tx({
            'from': alice, # doesn't matter who sends it
        }))
        claim2_receipt = web3.eth.waitForTransactionReceipt(claim2_txhash)
        assert claim2_receipt.status == 0 # Revert
        assert alice_after_balance == clickToken.functions.balanceOf(
            alice
        ).call()
    except ValueError as err:
        assert 'already-claimed' in str(err), \
            "Unexpected error:, {}".format(err)

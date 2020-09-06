pragma solidity >=0.6.12 <0.7.0;

/**
 * THE CLICK TOKEN HAS RISEN
 *
 * SPDX-License-Identifier: MIT
 */

import "./lib/openzeppelin/contracts/access/Ownable.sol";
import "./lib/openzeppelin/contracts/token/ERC777/ERC777.sol";

contract ClickToken is Ownable, ERC777 {
    event SignerAdded(address signer);
    event SignerRemoved(address signer);

    // The accounts that have the right sign claims
    mapping(address => bool) public signers;

    constructor(address _claimSigner, uint256 initialSupply) ERC777("ClickToken", "CLK", new address[](0)) public {
        // mint for owner because he's cool
        addSigner(_claimSigner);

        // Mint an initialsupply
        bytes memory zero = new bytes(0);
        _mint(msg.sender, initialSupply, zero, zero);
    }

    /**
     * @dev Split a signature into v, r, s
     * @param sig Signature
     * @return v of the given signature
     * @return r of the given signature
     * @return s of the given signature
     */
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65, "invalid-signature");

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // TODO: Is there any reason not to do this?
        if (v == uint8(0) || v == uint8(1)) {
            v += 27;
        }

        return (v, r, s);
    }

    /**
     * @dev Recover signing account using message and signature
     * @param message Signed message
     * @param sig Signature
     * @return address of signer
     */
    function recoverSigner(bytes32 message, bytes memory sig)
        public
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    /**
     * @dev Recover signing account using message and signature
     * @param message Signed message
     * @param v of signature
     * @param r of signature
     * @param s of signature
     * @return recovered address of signer
     */
    function recoverSigner(bytes32 message, uint8 v, bytes32 r, bytes32 s)
        public
        pure
        returns (address)
    {
        return ecrecover(message, v, r, s);
    }

    /**
     * @dev Add an account that's authorized to sign claims
     * @param hash to prefix
     * @return Prefixed and hashed hash
     */
    function prefixHash(bytes32 hash) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
    }

    /**
     * @dev Hash a claim
     * @param recipient of claim
     * @param uid of claim
     * @param amount of claim
     * @return Hash of claim
     */
    function hashClaim(address recipient, bytes32 uid, uint256 amount)
        public
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(recipient, uid, amount, address(this)));
    }

    /**
     * @dev Check if an account is an authorized signer
     * @param signer address to check
     * @return If the given address is an authorized signer
     */
    function isSigner(address signer) public view returns (bool) {
        return signers[signer] == true;
    }

    /**
     * @dev Add an account that's authorized to sign claims
     * @param signer address of signer account to add
     */
    function addSigner(address signer) public onlyOwner
    {
        signers[signer] = true;
        emit SignerAdded(signer);
    }

    /**
     * @dev Remove an account that's authorized to sign claims
     * @param signer address of account to remove
     */
    function removeSigner(address signer) public onlyOwner
    {
        signers[signer] = false;
        emit SignerRemoved(signer);
    }

    /**
     * @dev Check a claim and return signing account
     * @param recipient of claim
     * @param uid of claim
     * @param amount of claim
     * @param signature of claim
     * @return address of the signer
     */
    function checkClaim(
        address recipient,
        bytes32 uid,
        uint256 amount,
        bytes memory signature
    ) public view returns (address)
    {
        bytes32 claimHash = hashClaim(recipient, uid, amount);
        bytes32 prefixedHash = prefixHash(claimHash);
        return recoverSigner(prefixedHash, signature);
    }

    /**
     * @dev Mint tokens for the given account if the claim is valid
     * @param recipient of the minted the tokens
     * @param uid of claim
     * @param amount of claim
     * @param signature of claim
     * @param userData ERC777 userData
     * @param operatorData ERC777 operatorData
     */
    function claim(
        address recipient,
        bytes32 uid,
        uint256 amount,
        bytes memory signature,
        bytes memory userData,
        bytes memory operatorData
    ) public
    {
        // validate signature
        address recovered = checkClaim(recipient, uid, amount, signature);

        require(signers[recovered], "invalid-signer");

        // if valid, mint amount
        _mint(recipient, amount, userData, operatorData);
    }

    /**
     * @dev Mint tokens for the given account if the claim is valid
     * @param recipient of the minted tokens
     * @param uid of claim
     * @param amount of claim
     * @param signature of claim
     */
    function claim(
        address recipient,
        bytes32 uid,
        uint256 amount,
        bytes memory signature
    ) public
    {
        bytes memory zero = new bytes(0);
        return claim(recipient, uid, amount, signature, zero, zero);
    }
}

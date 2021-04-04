// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;

contract ZkSwap {

    
    bytes32 public balances = 0x506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1;
	event BalanceUpdate(address _from, uint64 ethAmount, uint64 tokenAmount, uint64 nonce);
	event DepositReceived(uint amount, bool eth, address addrs);
    struct Balance {
		uint64 ethAmount;
		uint64 tokenAmount;
		uint64 nonce;
		address payable from;
        uint64 deltaEth;
        uint64 deltaToken;
	}

    function Deposit()
        external 
        payable
    {
        emit DepositReceived(msg.value, true, msg.sender);
    }

	function verifyDepWith(
		Balance[] memory incomingBalances,
		bytes32 oldRoot, 
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] memory dataHash
	)
		external
		payable
	{	
		require(oldRoot == balances);
		// require(Verifier(verifier).verifyTx(a, b, c, dataHash), "Proof verification failed!"); // passes
		bytes32 result = hashDepWithData(incomingBalances, newRoot);
		// emit Success(checkTradeData(incomingBalances, concatHashes(dataHash[0], dataHash[1]), balances, newRoot));
		for(uint i = 0; i < incomingBalances.length; i++) {
			emit BalanceUpdate(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce);
            //handles withdraw requests
            if(incomingBalances[i].deltaEth > 0){
                _sendEth(incomingBalances[i].deltaEth, incomingBalances[i].from);
            } 
            // else if(incomingBalances[i].deltaEth > 0) {
            //     _sendToken(incomingBalances[i].deltaToken, incomingBalances[i].from);
            // }
		}
		balances = newRoot; // reassigns
		// setTokenAmount(); // is called and updates
	}

	function hashDepWithData(Balance[] memory incomingBalances, bytes32 newRoot) // reimplement for dynamic array size
		public
		returns (bytes32)
	{	
		bytes32 roots = sha256(abi.encodePacked(balances, newRoot));
		bytes32 res;
		for(uint i = 0; i < 3; i++){
            res = sha256(abi.encodePacked(res,  hashBalanceMovement(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce, incomingBalances[i].deltaEth, incomingBalances[i].deltaToken)));
		}
		return sha256(abi.encodePacked(res, roots));
	}

	function _sendEth(uint amountWei, address payable _to)
		private
		returns (bool)
	{
		(bool sent, ) = _to.call{value: amountWei}("");
        return sent;
	}

	function hashBalanceMovement(address sender, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 deltaEth, uint64 deltaToken)
		private
		pure
		returns (bytes32)
	{
		return sha256(abi.encodePacked(sender, ethAmount, tokenAmount, nonce, deltaEth, deltaToken));
	}
	
	receive() external payable { // for testing...
    }

	function concatHashes(uint a, uint b)
        private
		pure
        returns (bytes32)
    {
        uint256 result; 
        result = result | a << 128;
		result = result | b;
       return bytes32(result);
    }
}

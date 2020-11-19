// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";

contract ZkSwap {

	bytes32 public users = 0xe3d4879dd9a5530315210a62ccfcb361e4d19093e27212732cbb24d43774df2a; // initial root with 1 set account and 3 zero accounts
	bytes32 public balances = 0x21ddb9a356815c3fac1026b6dec5df3124afbadb485c9ba5a3e3398a04b7ba85;
	address public erc20;
	enum CurrecyType { Ether, Bat }

	modifier canUpdateBalance(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint batAmount, uint nonce)
	{
		require(verifyUserMerkle(userProof, keccak256(abi.encodePacked(msg.sender)))); // makes sure sender is registered
 		require(verifyBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount, batAmount, nonce)))); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr)
        public
    {
		erc20 = ercAddr;
	}

	event Registered(address _from);
	event Deposit(address _from, uint etherAmount, uint batAmount);
	
    event Debug(uint amount);

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
	{
		require(checkInputs(proof, oldLeaf));
		require(verifyUserMerkle(proof, oldLeaf));
		updateUserMerkle(proof, keccak256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}
	
	function getSupply()
	    public
	{
	    emit Debug(IERC20(erc20).totalSupply());
	}
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint batAmount, uint nonce)
		public
		payable
		canUpdateBalance(userProof, balanceProof, ethAmount, batAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount + msg.value, batAmount, nonce)));
		emit Deposit(msg.sender, ethAmount + msg.value, batAmount);
	}

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint batAmount, uint nonce)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, batAmount, nonce)
	{

	}

	function withdraw(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint batAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, batAmount, nonce)
	{
		// if(type == uint8(CurrencyType.Ether)){
			require(ethAmount >= withdrawAmount);
			updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount - withdrawAmount, batAmount, nonce)));
			emit Deposit(msg.sender, ethAmount - withdrawAmount, batAmount);
			(bool success, ) = msg.sender.call.value(withdrawAmount)("");
        require(success, "Transfer failed.");
		// } else if(type == uint8(CurrecyType.Bat)){
		// 	require(batAmount >= withdrawAmount);
		// }

		
	}


	function verifyUserMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal 
		view
		returns (bool) 
	{
        return computeMerkle(proof, leaf) == users;
    }

	function updateUserMerkle(bytes32[] memory proof, bytes32 leaf)
		internal
	{
		users = computeMerkle(proof, leaf);
	}

	function verifyBalanceMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal 
		view
		returns (bool) 
	{
        return computeMerkle(proof, leaf) == balances;
    }

	function updateBalanceMerkle(bytes32[] memory proof, bytes32 leaf)
		internal
	{

		balances = computeMerkle(proof, leaf);
	}

	function computeMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal
		pure 
		returns (bytes32) 
	{
		bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
		return computedHash;
	}

	function checkInputs(bytes32[] memory proof, bytes32 leaf)
		internal
		pure
		returns (bool)
	{
		bytes32 emptyLeafPairHash = 0x57570dbcb8388f7a4cb09bf05bcb6c44f46b11a956b25a1b6d50a2d27f2ee71e;
		require(leaf == keccak256(abi.encodePacked(address(0x0)))); // makes sure the oldLeaf is empty => Not overwriting another account
		require(
			(proof[0] != keccak256(abi.encodePacked(address(0x0))) && proof[1] == emptyLeafPairHash) || // if the leaf pair is not empty, the following pair must be a emptyLeafPairHash
			(proof[0] == keccak256(abi.encodePacked(address(0x0))) && proof[1] != emptyLeafPairHash) // if the leafPait is empty, the next hash pait cant be empty
		);
		return true;
	}
}

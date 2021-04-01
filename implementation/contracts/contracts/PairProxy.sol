// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;
import "./interface/IUniswapV2Router02.sol";
import "./interface/IERC20.sol";
import "./interface/IZKSwap.sol";

contract PairProxy {

    event TradeComplete(uint dir, uint ethAmount, uint tokenAmount, uint poolId);
    
    address public token0 = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address public token1 = 0xb87241aAA3E8991C6922E830B61722838cF130fb;
    address public owner;
    
    IUniswapV2Router02 public router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IZkSwap public zkSwap;

    constructor(address payable zkSwapAddress) 
    {
        zkSwap = IZkSwap(zkSwapAddress);
        owner = msg.sender;
    }

    function ethForToken(uint minAmountOut, uint etherAmount) 
        external
        payable
    {
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;
        uint[] memory res = router.swapExactETHForTokens{value: etherAmount}(
            minAmountOut, 
            path,
            address(this),
            block.timestamp + 600
        );
        emit TradeComplete(0, res[0], res[1], 777);
    }
    
    function tokenForEth(uint minAmountOut, uint tokenAmount)
        external
        payable
    {
        IERC20(token1).approve(address(router), tokenAmount);
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token0;
        uint[] memory res = router.swapExactTokensForETH(
            tokenAmount,
            minAmountOut, 
            path,
            address(this),
            block.timestamp + 600
        );
        emit TradeComplete(1, res[1] / 1000000, res[0] / 1000000, 777);
    }

    function withdrawEth(uint amountWei)
		external
		returns (bool)
	{
        require(msg.sender == owner);
		(bool sent, ) = address(msg.sender).call{value: amountWei}("");
        return sent;
	}

	function sendToken(uint amountWei) // not working currently!!
		external
		returns (bool)
	{
        require(msg.sender == owner);
		return IERC20(token1).transfer(address(msg.sender), amountWei);
	}

    function verifyTrade(
		SharedTypes.Balance[] memory incomingBalances,
		uint64 direction,
		uint64 ethDelta,
		uint64 tokenDelta,
        bytes32 oldRoot,
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] memory dataHash
	) 
        external
    {
        if(direction == 0){ // we're sending tokens that we bought. Must approve before verifying
            IERC20(token1).approve(address(zkSwap), tokenDelta * 1000000);
            zkSwap.verifyTrade(incomingBalances, direction, ethDelta, tokenDelta, oldRoot, newRoot, a, b, c, dataHash);
            // zkSwap.verifyTrade(direction, ethDelta, tokenDelta, newRoot, a, b, c, dataHash);
        } else { // we're sending eth, can send with TX
            zkSwap.verifyTrade{value: ethDelta * 1000000}(incomingBalances, direction, ethDelta, tokenDelta, oldRoot, newRoot, a, b, c, dataHash);
            // zkSwap.verifyTrade{value: ethDelta * 1000000}(direction, ethDelta, tokenDelta, newRoot, a, b, c, dataHash);
        }
    }
    
    function approve() 
        external
        payable
    {
        IERC20(token1).approve(address(zkSwap), 100000000000000 * 1000000);
    }
	
    receive() external payable {
    }
}

// Direction 0:
//       trade: -Eth -> + Token
//       trans: +Eth -> -Token

// Direction 1:
//       trade: -Token -> +Eth
//       trans: +Token -> -Eth

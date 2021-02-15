import "./interface/IUniswapV2Router02.sol";
import "./openzeppelin/token/ERC20/IERC20.sol";
// import "./ZkSwap.sol"

contract PairProxy {

    event TradeComplete(uint dir, uint etherAmount, uint tokenAmount, uint poolId);
    address public token0;
    address public token1;
    address public owner;
    
    IUniswapV2Router02 public router;
    // ZkSwap public zkSwap;

    constructor(address token0Address, address token1Address, address routerAddress, address zkSwapAddress) 
        public
    {
        token0 = token0Address;
        token1 = token1Address;
        router = IUniswapV2Router02(routerAddress);
        // zkSwap = ZkSwap(zkSwapAddress);
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
        emit TradeComplete(1, res[1], res[0], 777);
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

    // function verifyTrade(
	// 	uint[] calldata ethAmount, 
	// 	uint[] calldata tokenAmount, 
	// 	uint[] calldata nonce,
	// 	address[] calldata from, 
	// 	uint direction,
	// 	uint ethDelta,
	// 	uint tokenDelta, 
	// 	uint[2] calldata a,
	// 	uint[2][2] calldata b,
	// 	uint[2] calldata c, 
	// 	uint[2] calldata input
	// ) 
    //     external
    //     payable
    // {
    //     if(direction == 0){ // we're sending tokens that we bought. Must approve before verifying
    //         IERC20(token1).approve(address(zkSwap), tokenDelte * 1000000);
    //         zkSwap.verifyTrade(ethAmount, tokenAmount, nonce, from, direction, ethDelta, tokenDelta, a, b, c, input);
    //     } else { // we're sending eth, can send with TX
    //         zkSwap.verifyTrade{value: ethDelta * 1000000}(ethAmount, tokenAmount, nonce, from, direction, ethDelta, tokenDelta, a, b, c, input);
    //     }
    // }
	
    receive() external payable {
    }
}

// Direction 0:
//       trade: -Eth -> + Token
//       trans: +Eth -> -Token

// Direction 1:
//       trade: -Token -> +Eth
//       trans: +Token -> -Eth

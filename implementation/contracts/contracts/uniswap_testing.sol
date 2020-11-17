import "./interface/IUniswapV2Router02.sol";

contract buyCoins {
    
    IUniswapV2Router02 usi = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    
    address[] public path = [0xc778417E063141139Fce010982780140Aa0cD5Ab, 0x443Fd8D5766169416aE42B8E050fE9422f628419];
    
    event Result(uint256[] res);

    
    function buyCryptoOnUniswap1(bool revert) public payable returns (uint256) {
        uint etherCost = 10000000000000000;
        uint deadline = now + 300; // using 'now' for convenience, for mainnet pass deadline from frontend!
    
        uint[] memory amounts = usi.swapExactETHForTokens.value(etherCost)(1000000000000000000, path, msg.sender, deadline);
        uint256 outputTokenCount = uint256(amounts[1]);
        require(!revert);
        return outputTokenCount;
    }
}

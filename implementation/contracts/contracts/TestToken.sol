// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
import "./openzeppelin/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    constructor () public ERC20("Token", "TKN") {
        _mint(0x31b878918679d9DA1DB277B1A2fD67Aa01032920, 1000000 * (10 ** uint256(decimals())));
    }
}
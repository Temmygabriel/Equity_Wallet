// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockStockToken} from "./MockStockToken.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";

contract MockSwapAdapter is ISwapAdapter {
    using SafeERC20 for IERC20;

    uint256 public outputAmount;

    function setOutputAmount(uint256 outputAmount_) external {
        outputAmount = outputAmount_;
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        amountOut = outputAmount;
        require(amountOut >= minAmountOut, "MockSwapAdapter: insufficient output");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        MockStockToken(tokenOut).mint(msg.sender, amountOut);
    }
}

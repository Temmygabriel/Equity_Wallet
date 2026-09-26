// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockStockToken} from "./MockStockToken.sol";
import {ISwapAdapter} from "../interfaces/ISwapAdapter.sol";

contract MockSwapAdapter is ISwapAdapter {
    using SafeERC20 for IERC20;

    uint256 public outputAmount;
    uint256 public rate = 1e18;
    bool public useFixedOutput;

    function setOutputAmount(uint256 outputAmount_) external {
        outputAmount = outputAmount_;
        useFixedOutput = true;
    }

    /// @notice Configures a deterministic 18-decimal output rate for demo deployments.
    function setRate(uint256 rate_) external {
        require(rate_ > 0, "MockSwapAdapter: zero rate");
        rate = rate_;
        useFixedOutput = false;
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut) {
        amountOut = useFixedOutput ? outputAmount : (amountIn * rate) / 1e18;
        require(amountOut >= minAmountOut, "MockSwapAdapter: insufficient output");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        MockStockToken(tokenOut).mint(msg.sender, amountOut);
    }
}

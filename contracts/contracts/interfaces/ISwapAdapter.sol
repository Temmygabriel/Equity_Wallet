// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISwapAdapter {
    /// @param minAmountOut Explicit floor on the output. Callers must never pass zero (Build Spec §4 rule 9).
    /// @param deadline Unix timestamp after which the swap must not execute. Bounds how long this
    ///        transaction may sit pending before it is priced against stale state.
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external returns (uint256 amountOut);
}

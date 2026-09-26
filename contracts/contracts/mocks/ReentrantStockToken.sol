// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockStockToken} from "./MockStockToken.sol";

contract ReentrantStockToken is MockStockToken {
    address public escrow;
    bytes public payload;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    constructor(uint256 multiplier_) MockStockToken("Reentrant Stock", "RNT", multiplier_) {}

    function configureReentry(address escrow_, bytes calldata payload_) external {
        escrow = escrow_;
        payload = payload_;
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (from == escrow && payload.length != 0 && !reentryAttempted) {
            reentryAttempted = true;
            (reentrySucceeded,) = escrow.call(payload);
        }
    }
}

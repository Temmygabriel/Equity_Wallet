// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IStockTokenMultiplier} from "../interfaces/IStockTokenMultiplier.sol";

contract MockStockToken is ERC20, IStockTokenMultiplier {
    uint256 private _multiplier;

    constructor(string memory name_, string memory symbol_, uint256 multiplier_) ERC20(name_, symbol_) {
        _multiplier = multiplier_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setUiMultiplier(uint256 multiplier_) external {
        _multiplier = multiplier_;
    }

    function uiMultiplier() external view returns (uint256) {
        return _multiplier;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISwapAdapter} from "./interfaces/ISwapAdapter.sol";
import {IStockTokenMultiplier} from "./interfaces/IStockTokenMultiplier.sol";

/// @notice Holds a funded contractor benefit until employer release or deadline claim.
/// @dev Constructor addresses are temporary testnet wiring and must be independently verified before deployment.
contract GrantEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { CREATED, FUNDED, RELEASED }

    struct Grant {
        address employer;
        address contractor;
        address selectedToken;
        uint256 rawEscrowAmount;
        uint256 fundingMultiplier;
        uint256 deadline;
        Status status;
    }

    IERC20 public immutable usdg;
    ISwapAdapter public immutable swapAdapter;
    address public immutable aapl;
    address public immutable tsla;
    address public immutable nvda;

    uint256 public grantCount;
    mapping(uint256 grantId => Grant grant) public grants;

    event GrantCreated(uint256 indexed grantId, address indexed employer, address indexed contractor, uint256 deadline);
    event GrantFunded(uint256 indexed grantId, address indexed selectedToken, uint256 rawEscrowAmount, uint256 fundingMultiplier);
    event GrantReleased(uint256 indexed grantId, address indexed contractor, uint256 rawEscrowAmount, bool timeoutClaim);

    constructor(address usdg_, address swapAdapter_, address aapl_, address tsla_, address nvda_) {
        require(usdg_ != address(0) && swapAdapter_ != address(0), "GrantEscrow: zero address");
        require(aapl_ != address(0) && tsla_ != address(0) && nvda_ != address(0), "GrantEscrow: zero address");
        require(aapl_ != tsla_ && aapl_ != nvda_ && tsla_ != nvda_, "GrantEscrow: duplicate stock token");

        usdg = IERC20(usdg_);
        swapAdapter = ISwapAdapter(swapAdapter_);
        aapl = aapl_;
        tsla = tsla_;
        nvda = nvda_;
    }

    function createGrant(address contractor, uint256 deadline) external returns (uint256 grantId) {
        require(contractor != address(0), "GrantEscrow: invalid contractor");
        require(deadline > block.timestamp, "GrantEscrow: invalid deadline");

        grantId = grantCount++;
        grants[grantId] = Grant({
            employer: msg.sender,
            contractor: contractor,
            selectedToken: address(0),
            rawEscrowAmount: 0,
            fundingMultiplier: 0,
            deadline: deadline,
            status: Status.CREATED
        });
        emit GrantCreated(grantId, msg.sender, contractor, deadline);
    }

    function fundGrant(uint256 grantId, uint256 usdgAmount, address selectedToken, uint256 minStockOut, uint256 swapDeadline) external {
        Grant storage grant = grants[grantId];
        require(msg.sender == grant.employer, "GrantEscrow: only employer");
        require(grant.status == Status.CREATED, "GrantEscrow: grant not created");
        require(usdgAmount > 0, "GrantEscrow: zero funding");
        require(_isSupportedStock(selectedToken), "GrantEscrow: unsupported stock token");
        // Build Spec §4 rule 9. A zero floor would make the check below vacuous and leave the
        // employer open to a sandwich on the swap, so it is rejected outright rather than defaulted.
        require(minStockOut > 0, "GrantEscrow: zero minStockOut");
        require(swapDeadline >= block.timestamp, "GrantEscrow: swap deadline passed");

        usdg.safeTransferFrom(msg.sender, address(this), usdgAmount);
        usdg.forceApprove(address(swapAdapter), usdgAmount);

        uint256 stockBalanceBefore = IERC20(selectedToken).balanceOf(address(this));
        uint256 reportedAmountOut = swapAdapter.swap(address(usdg), selectedToken, usdgAmount, minStockOut, swapDeadline);
        uint256 rawEscrowAmount = IERC20(selectedToken).balanceOf(address(this)) - stockBalanceBefore;

        usdg.forceApprove(address(swapAdapter), 0);
        require(rawEscrowAmount >= minStockOut && reportedAmountOut >= minStockOut, "GrantEscrow: insufficient stock output");

        grant.selectedToken = selectedToken;
        grant.rawEscrowAmount = rawEscrowAmount;
        grant.fundingMultiplier = IStockTokenMultiplier(selectedToken).uiMultiplier();
        grant.status = Status.FUNDED;
        emit GrantFunded(grantId, selectedToken, rawEscrowAmount, grant.fundingMultiplier);
    }

    function releaseGrant(uint256 grantId) external nonReentrant {
        Grant storage grant = grants[grantId];
        require(msg.sender == grant.employer, "GrantEscrow: only employer");
        require(grant.status == Status.FUNDED, "GrantEscrow: grant not funded");
        require(block.timestamp < grant.deadline, "GrantEscrow: deadline passed");
        _release(grant, grantId, false);
    }

    function claimAfterTimeout(uint256 grantId) external nonReentrant {
        Grant storage grant = grants[grantId];
        require(msg.sender == grant.contractor, "GrantEscrow: only contractor");
        require(grant.status == Status.FUNDED, "GrantEscrow: grant not funded");
        require(block.timestamp >= grant.deadline, "GrantEscrow: deadline not reached");
        _release(grant, grantId, true);
    }

    function _release(Grant storage grant, uint256 grantId, bool timeoutClaim) private {
        // Effects precede interaction. Payout must always remain the raw amount fixed at funding.
        grant.status = Status.RELEASED;
        IERC20(grant.selectedToken).safeTransfer(grant.contractor, grant.rawEscrowAmount);
        emit GrantReleased(grantId, grant.contractor, grant.rawEscrowAmount, timeoutClaim);
    }

    function _isSupportedStock(address token) private view returns (bool) {
        return token == aapl || token == tsla || token == nvda;
    }
}

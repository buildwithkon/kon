// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AppPoint is ERC20, Ownable {
    mapping(address => bool) public admins;
    mapping(address => uint256) public totalReceivedPoints;

    constructor(string memory name, string memory symbol, address initialOwner)
        ERC20(name, symbol)
        Ownable(initialOwner)
    {
        _transferOwnership(initialOwner); // Set the initial owner
        admins[initialOwner] = true; // Set the initial owner as an admin
    }

    // Add an admin (only callable by the owner)
    function addAdmin(address account) external onlyOwner {
        admins[account] = true;
    }

    // Remove an admin (only callable by the owner)
    function removeAdmin(address account) external onlyOwner {
        admins[account] = false;
    }

    // Distribute points (only callable by admins)
    function distributePoints(address to, uint256 amount) external {
        require(admins[msg.sender], "Only admins can distribute points");
        _mint(to, amount);
        totalReceivedPoints[to] += amount;
    }

    // Tip points from one user to another
    function tip(address to, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance for tip");
        _transfer(msg.sender, to, amount);
        totalReceivedPoints[to] += amount;
    }

    // Redeem points for rewards
    function redeemPointsForReward(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to redeem");
        _burn(msg.sender, amount);
        // Custom reward redemption logic can be added here
    }

    // Get the total points received by a specific user
    function getTotalReceivedPoints(address user) external view returns (uint256) {
        return totalReceivedPoints[user];
    }
}

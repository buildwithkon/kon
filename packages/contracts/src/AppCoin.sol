// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AppCoin is ERC20, Ownable {
    mapping(address => bool) public admins;
    mapping(address => uint256) public totalReceivedCoins;

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

    // Distribute coins (only callable by admins)
    function distributeCoins(address to, uint256 amount) external {
        require(admins[msg.sender], "Only admins can distribute coins");
        _mint(to, amount);
        totalReceivedCoins[to] += amount;
    }

    // Tip coins from one user to another
    function tip(address to, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance for tip");
        _transfer(msg.sender, to, amount);
        totalReceivedCoins[to] += amount;
    }

    // Redeem coins for rewards
    function redeemCoinsForReward(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to redeem");
        _burn(msg.sender, amount);
        // Custom reward redemption logic can be added here
    }

    // Get the total coins received by a specific user
    function getTotalReceivedCoins(address user) external view returns (uint256) {
        return totalReceivedCoins[user];
    }
}

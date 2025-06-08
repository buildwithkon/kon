// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./AppCoin.sol";

contract AppCoinFactory {
    // Track all created AppCoins by their owner's address
    mapping(address => address[]) public appCoinsByOwner;
    // Track all created AppCoins with an array of addresses
    address[] public allAppCoins;

    event AppCoinCreated(address indexed appCoinAddress, address indexed owner, string name, string symbol);

    // Create a new AppCoin contract instance
    function createAppCoin(string memory name, string memory symbol) external {
        // Deploy a new AppCoin contract with the caller as the owner
        AppCoin appCoin = new AppCoin(name, symbol, msg.sender);
        appCoinsByOwner[msg.sender].push(address(appCoin));
        allAppCoins.push(address(appCoin));

        // Emit an event for tracking the new AppCoin instance
        emit AppCoinCreated(address(appCoin), msg.sender, name, symbol);
    }

    // Get all AppCoins created by a specific owner
    function getAppCoinsByOwner(address owner) external view returns (address[] memory) {
        return appCoinsByOwner[owner];
    }

    // Get the total number of AppCoin instances created
    function getTotalAppCoins() external view returns (uint256) {
        return allAppCoins.length;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./AppPoint.sol";

contract AppPointFactory {
    // Track all created AppPoints by their owner's address
    mapping(address => address[]) public appPointsByOwner;
    // Track all created AppPoints with an array of addresses
    address[] public allAppPoints;

    event AppPointCreated(address indexed appPointAddress, address indexed owner, string name, string symbol);

    // Create a new AppPoint contract instance
    function createAppPoint(string memory name, string memory symbol) external {
        // Deploy a new AppPoint contract with the caller as the owner
        AppPoint appPoint = new AppPoint(name, symbol, msg.sender);
        appPointsByOwner[msg.sender].push(address(appPoint));
        allAppPoints.push(address(appPoint));

        // Emit an event for tracking the new AppPoint instance
        emit AppPointCreated(address(appPoint), msg.sender, name, symbol);
    }

    // Get all AppPoints created by a specific owner
    function getAppPointsByOwner(address owner) external view returns (address[] memory) {
        return appPointsByOwner[owner];
    }

    // Get the total number of AppPoint instances created
    function getTotalAppPoints() external view returns (uint256) {
        return allAppPoints.length;
    }
}
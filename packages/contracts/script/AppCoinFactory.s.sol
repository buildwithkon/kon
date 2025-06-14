// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/AppCoinFactory.sol";

contract Deploy is Script {
    function run(string memory name, string memory symbol) external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Deploy AppCoinFactory
        AppCoinFactory factory = new AppCoinFactory();
        console.log("AppCoinFactory deployed at:", address(factory));

        // Create initial AppCoin with provided name and symbol
        factory.createAppCoin(name, symbol);
        console.log("Initial AppCoin created with name:", name, "and symbol:", symbol);

        vm.stopBroadcast();
    }
}
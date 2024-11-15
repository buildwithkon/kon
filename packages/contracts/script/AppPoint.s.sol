// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppPointFactory.sol";

contract AppPointScript is Script {
    function run() external {
        vm.startBroadcast();

        // Load the factory address from the environment variable
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        AppPointFactory factory = AppPointFactory(factoryAddress);

        // Deploy a new AppPoint using the factory
        factory.createAppPoint("KonAppPoint", "KON");

        vm.stopBroadcast();
    }
}

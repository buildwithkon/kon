// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppPointFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Load the factory address from the environment variable
        address factoryAddress = vm.envAddress("APP_POINT_FACTORY_ADDRESS");
        AppPointFactory factory = AppPointFactory(factoryAddress);

        // Deploy a new AppPoint using the factory
        factory.createAppPoint("KonPoint", "KON");

        vm.stopBroadcast();
    }
}

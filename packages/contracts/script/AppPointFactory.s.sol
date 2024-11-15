// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppPointFactory.sol";

contract AppPointFactoryScript is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy AppPointFactory
        AppPointFactory factory = new AppPointFactory();
        console.log("AppPointFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
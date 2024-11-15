// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppPointFactory.sol";

contract AppPointFactoryScript is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Deploy AppPointFactory
        AppPointFactory factory = new AppPointFactory();
        console.log("AppPointFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
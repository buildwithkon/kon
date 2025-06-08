// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppCoinFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Deploy AppCoinFactory
        AppCoinFactory factory = new AppCoinFactory();
        console.log("AppCoinFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
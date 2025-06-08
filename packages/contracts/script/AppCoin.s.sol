// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/AppCoin.sol";
import "../src/AppCoinFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Load the factory address from the environment variable
        address factoryAddress = vm.envAddress("APP_COIN_FACTORY_ADDRESS");
        AppCoinFactory factory = AppCoinFactory(factoryAddress);

        new AppCoin("Test AppCoin", "TEST", msg.sender);

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/AppCoin.sol";
import "../src/AppCoinFactory.sol";

contract Deploy is Script {
    function run(string memory name, string memory symbol) external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        // Load the factory address from the environment variable
        address factoryAddress = vm.envAddress("APP_COIN_FACTORY_ADDRESS");
        AppCoinFactory factory = AppCoinFactory(factoryAddress);

        // Create new AppCoin with provided name and symbol
        factory.createAppCoin(name, symbol);
        console.log("AppCoin created with name:", name, "and symbol:", symbol);

        vm.stopBroadcast();
    }
}

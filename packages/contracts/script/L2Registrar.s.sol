// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {L2Registrar} from "../src/L2Registrar.sol";
import {IL2Registry} from "../src/IL2Registry.sol";

contract Deploy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address registryAddress = vm.envAddress("ENS_L2_REGISTRY_ADDRESS");

        vm.startBroadcast(privateKey);

        L2Registrar registrar = new L2Registrar(IL2Registry(registryAddress));

        vm.stopBroadcast();
    }
}

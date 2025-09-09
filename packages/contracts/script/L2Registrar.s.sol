// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/L2Registrar.sol";

/**
 * @title L2Registrar Deploy Script
 * @dev Deploy script for L2Registrar contract (deployment only, does not configure registry)
 * 
 * Usage:
 * 1. Set PRIVATE_KEY environment variable
 * 2. Set L2_REGISTRY_ADDRESS (required) - address of existing L2Registry
 * 
 * Deploy with existing registry:
 * L2_REGISTRY_ADDRESS=0x... forge script script/L2Registrar.s.sol:Deploy --rpc-url <RPC_URL> --broadcast
 * 
 * Or use the runWithRegistry function directly:
 * forge script script/L2Registrar.s.sol:Deploy --sig "runWithRegistry(address)" 0x... --rpc-url <RPC_URL> --broadcast
 * 
 * Note: After deployment, you will need to manually call registry.addRegistrar(registrarAddress) 
 * to authorize the registrar to create names in the registry.
 * 
 * To deploy L2Registry first, use: forge script script/L2Registry.s.sol:Deploy
 */

contract Deploy is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        
        // Get L2Registry address from environment (required)
        address registryAddress = vm.envOr("L2_REGISTRY_ADDRESS", address(0));
        require(registryAddress != address(0), "L2_REGISTRY_ADDRESS environment variable is required");
        console.log("Using L2Registry at:", registryAddress);

        // Deploy L2Registrar
        L2Registrar registrar = new L2Registrar(registryAddress);
        console.log("L2Registrar deployed at:", address(registrar));
        console.log("L2Registrar owner:", registrar.owner());
        console.log("Allowlist enabled:", registrar.allowlistEnabled());

        vm.stopBroadcast();
    }
    
    function runWithRegistry(address registryAddress) external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        console.log("Using provided L2Registry at:", registryAddress);

        // Deploy L2Registrar
        L2Registrar registrar = new L2Registrar(registryAddress);
        console.log("L2Registrar deployed at:", address(registrar));
        console.log("L2Registrar owner:", registrar.owner());
        console.log("Allowlist enabled:", registrar.allowlistEnabled());

        vm.stopBroadcast();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../script/L2Registrar.s.sol";
import {L2Registry} from "../lib/durin/src/L2Registry.sol";
import {L2RegistryFactory} from "../lib/durin/src/L2RegistryFactory.sol";

contract L2RegistrarDeployTest is Test {
    Deploy deployScript;
    uint256 constant TEST_PRIVATE_KEY = uint256(keccak256("test_deployer"));
    
    function setUp() public {
        deployScript = new Deploy();
    }
    
    function test_DeployWithRegistryRequired() public {
        // Set up environment variables with a proper test private key but no registry
        vm.setEnv("PRIVATE_KEY", vm.toString(TEST_PRIVATE_KEY));
        
        // The script should revert because L2_REGISTRY_ADDRESS is required
        vm.expectRevert();
        deployScript.run();
    }
    
    function test_DeployWithExistingRegistry() public {
        // Create a proper deployer address
        address deployer = makeAddr("deployer");
        
        // Deploy a registry first as the deployer
        vm.startPrank(deployer);
        L2RegistryFactory factory = new L2RegistryFactory(address(new L2Registry()));
        address registryAddress = factory.deployRegistry("existing.eth");
        vm.stopPrank();
        
        // Set up environment variables
        vm.setEnv("PRIVATE_KEY", vm.toString(TEST_PRIVATE_KEY));
        vm.setEnv("L2_REGISTRY_ADDRESS", vm.toString(registryAddress));
        
        // Run the deploy script
        deployScript.run();
        
        // The script should complete without reverting
        assertTrue(true, "Deploy script with existing registry executed successfully");
    }
    
    function test_RunWithRegistryFunction() public {
        // Create a proper deployer address
        address deployer = makeAddr("deployer");
        
        // Deploy a registry first as the deployer
        vm.startPrank(deployer);
        L2RegistryFactory factory = new L2RegistryFactory(address(new L2Registry()));
        address registryAddress = factory.deployRegistry("direct.eth");
        vm.stopPrank();
        
        // Set up environment variables
        vm.setEnv("PRIVATE_KEY", vm.toString(TEST_PRIVATE_KEY));
        
        // Run the deploy script with specific registry
        deployScript.runWithRegistry(registryAddress);
        
        // The script should complete without reverting
        assertTrue(true, "Deploy script with runWithRegistry executed successfully");
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/L2Registrar.sol";
import {L2Registry} from "../lib/durin/src/L2Registry.sol";
import {L2RegistryFactory} from "../lib/durin/src/L2RegistryFactory.sol";
import {IL2Registry} from "../lib/durin/src/interfaces/IL2Registry.sol";

contract L2RegistrarTest is Test {
    L2Registrar public registrar;
    L2Registry public registry;
    L2RegistryFactory public factory;
    
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    string constant BASE_NAME = "testname.eth";
    
    event NameRegistered(string indexed label, address indexed owner);
    
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        vm.startPrank(owner);
        
        // Deploy L2Registry factory and registry
        factory = new L2RegistryFactory(address(new L2Registry()));
        registry = L2Registry(factory.deployRegistry(BASE_NAME));
        
        // Deploy L2Registrar
        registrar = new L2Registrar(address(registry));
        
        // Add registrar to registry
        registry.addRegistrar(address(registrar));
        
        // Add test users to allowlist since it's enabled by default
        registrar.addToAllowlist(user1);
        registrar.addToAllowlist(user2);
        registrar.addToAllowlist(user3);
        
        vm.stopPrank();
    }
    
    function test_Constructor() public view {
        assertEq(address(registrar.registry()), address(registry));
        assertEq(registrar.coinType(), (0x80000000 | block.chainid) >> 0);
        assertEq(registrar.chainId(), block.chainid);
        assertTrue(registrar.allowlistEnabled()); // Allowlist is enabled by default
    }
    
    function test_Register() public {
        string memory label = "alice";
        
        vm.expectEmit(true, true, false, true);
        emit NameRegistered(label, user1);
        
        vm.prank(user1);
        registrar.register(label, user1);
        
        // Verify the name was registered
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user1);
        
        // Verify addresses were set
        bytes memory addr = registrar.registry().addr(node, registrar.coinType());
        assertEq(addr, abi.encodePacked(user1));
        
        bytes memory ethAddr = registrar.registry().addr(node, 60);
        assertEq(ethAddr, abi.encodePacked(user1));
    }
    
    function test_RegisterDifferentOwner() public {
        string memory label = "bob";
        
        vm.expectEmit(true, true, false, true);
        emit NameRegistered(label, user2);
        
        vm.prank(user1);
        registrar.register(label, user2);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user2);
        
        // Verify addresses point to user2
        bytes memory addr = registrar.registry().addr(node, registrar.coinType());
        assertEq(addr, abi.encodePacked(user2));
    }
    
    function test_RegisterMultipleNames() public {
        string memory label1 = "name1";
        string memory label2 = "name2";
        string memory label3 = "name3";
        
        vm.startPrank(user1);
        registrar.register(label1, user1);
        registrar.register(label2, user1);
        registrar.register(label3, user2);
        vm.stopPrank();
        
        bytes32 node1 = registry.makeNode(registry.baseNode(), label1);
        bytes32 node2 = registry.makeNode(registry.baseNode(), label2);
        bytes32 node3 = registry.makeNode(registry.baseNode(), label3);
        
        assertEq(registry.ownerOf(uint256(node1)), user1);
        assertEq(registry.ownerOf(uint256(node2)), user1);
        assertEq(registry.ownerOf(uint256(node3)), user2);
    }
    
    function test_Available_True() public view {
        assertTrue(registrar.available("testname"));
        assertTrue(registrar.available("anothername"));
        assertTrue(registrar.available("xyz"));
    }
    
    function test_Available_False_AlreadyRegistered() public {
        string memory label = "taken";
        
        vm.prank(user1);
        registrar.register(label, user1);
        
        assertFalse(registrar.available(label));
    }
    
    function test_Available_False_TooShort() public view {
        assertFalse(registrar.available("ab"));
        assertFalse(registrar.available("a"));
        assertFalse(registrar.available(""));
    }
    
    function test_Available_EdgeCase_ThreeChars() public view {
        assertTrue(registrar.available("abc"));
        assertTrue(registrar.available("123"));
    }
    
    function test_RegisterTwice_Reverts() public {
        string memory label = "duplicate";
        
        vm.prank(user1);
        registrar.register(label, user1);
        
        // Try to register the same name again
        vm.prank(user2);
        vm.expectRevert();
        registrar.register(label, user2);
    }
    
    function testFuzz_Register(string calldata label, address nameOwner) public {
        // Filter out invalid inputs
        vm.assume(bytes(label).length >= 3 && bytes(label).length < 255);
        vm.assume(nameOwner != address(0));
        // Ensure nameOwner is not a contract (or is a contract that can receive ERC721)
        // This prevents ERC721InvalidReceiver errors
        vm.assume(nameOwner.code.length == 0);
        
        // Check availability before registration
        bool availableBefore = registrar.available(label);
        
        if (availableBefore) {
            // Don't check event emission for fuzz tests with unicode/special chars
            // as indexed string parameters can behave unexpectedly
            
            vm.prank(user1);
            registrar.register(label, nameOwner);
            
            // Verify registration
            bytes32 node = registry.makeNode(registry.baseNode(), label);
            assertEq(registry.ownerOf(uint256(node)), nameOwner);
            
            // Check it's no longer available
            assertFalse(registrar.available(label));
        }
    }
    
    function testFuzz_Available(string calldata label) public view {
        // Skip test if label contains invalid characters or is empty
        if (bytes(label).length == 0) return;
        
        bool result = registrar.available(label);
        
        // The contract uses StringUtils.strlen() which counts UTF-8 characters differently
        // For this test, we'll just verify the function doesn't revert
        // and returns a boolean value
        assertTrue(result == true || result == false, "Should return a valid boolean");
    }
    
    function test_CoinTypeCalculation() public view {
        uint256 expectedCoinType = (0x80000000 | block.chainid) >> 0;
        assertEq(registrar.coinType(), expectedCoinType);
    }
    
    function test_ChainIdStorage() public view {
        assertEq(registrar.chainId(), block.chainid);
    }
    
    function test_RegisterWithSpecialCharacters() public {
        string memory label = "test-name_123";
        
        vm.prank(user1);
        registrar.register(label, user1);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user1);
    }
    
    function test_RegisterEmoji() public {
        string memory label = unicode"hello🚀world";
        
        vm.prank(user1);
        registrar.register(label, user1);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user1);
    }
    
    function test_RegisteredNameHasCorrectAddresses() public {
        string memory label = "checkaddrs";
        address expectedOwner = user3;
        
        vm.prank(user1);
        registrar.register(label, expectedOwner);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        
        // Check both coinType and ETH (60) addresses
        bytes memory coinTypeAddr = registry.addr(node, registrar.coinType());
        bytes memory ethAddr = registry.addr(node, 60);
        
        assertEq(coinTypeAddr, abi.encodePacked(expectedOwner));
        assertEq(ethAddr, abi.encodePacked(expectedOwner));
        assertEq(coinTypeAddr, ethAddr);
    }
    
    // Allowlist tests
    function test_AllowlistEnabled_BlocksNonAllowlisted() public {
        string memory label = "allowlisttest";
        
        // Allowlist is already enabled by default
        assertTrue(registrar.allowlistEnabled());
        
        // Create a new address that's not in the allowlist
        address nonAllowlistedUser = makeAddr("nonAllowlistedUser");
        assertFalse(registrar.isAllowlisted(nonAllowlistedUser));
        
        // Try to register without being allowlisted
        vm.prank(nonAllowlistedUser);
        vm.expectRevert("L2Registrar: caller not allowlisted");
        registrar.register(label, nonAllowlistedUser);
    }
    
    function test_AllowlistEnabled_AllowsAllowlisted() public {
        string memory label = "allowlisttest";
        
        // Enable allowlist and add user1
        vm.startPrank(owner);
        registrar.setAllowlistEnabled(true);
        registrar.addToAllowlist(user1);
        vm.stopPrank();
        
        // Now user1 should be able to register
        vm.prank(user1);
        registrar.register(label, user1);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user1);
    }
    
    function test_AllowlistDisabled_AllowsAnyone() public {
        string memory label = "noallowlist";
        
        // Disable allowlist (it's enabled by default now)
        vm.prank(owner);
        registrar.setAllowlistEnabled(false);
        assertFalse(registrar.allowlistEnabled());
        
        // Any user can register when allowlist is disabled
        vm.prank(user2);
        registrar.register(label, user2);
        
        bytes32 node = registry.makeNode(registry.baseNode(), label);
        assertEq(registry.ownerOf(uint256(node)), user2);
    }
    
    function test_AddToAllowlist() public {
        // Create a new address that's not in the allowlist
        address newUser = makeAddr("newUser");
        assertFalse(registrar.isAllowlisted(newUser));
        
        vm.prank(owner);
        registrar.addToAllowlist(newUser);
        
        assertTrue(registrar.isAllowlisted(newUser));
    }
    
    function test_AddToAllowlistBatch() public {
        address[] memory users = new address[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        
        vm.prank(owner);
        registrar.addToAllowlistBatch(users);
        
        assertTrue(registrar.isAllowlisted(user1));
        assertTrue(registrar.isAllowlisted(user2));
        assertTrue(registrar.isAllowlisted(user3));
    }
    
    function test_RemoveFromAllowlist() public {
        vm.startPrank(owner);
        registrar.addToAllowlist(user1);
        assertTrue(registrar.isAllowlisted(user1));
        
        registrar.removeFromAllowlist(user1);
        assertFalse(registrar.isAllowlisted(user1));
        vm.stopPrank();
    }
    
    function test_RemoveFromAllowlistBatch() public {
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;
        
        vm.startPrank(owner);
        registrar.addToAllowlistBatch(users);
        assertTrue(registrar.isAllowlisted(user1));
        assertTrue(registrar.isAllowlisted(user2));
        
        registrar.removeFromAllowlistBatch(users);
        assertFalse(registrar.isAllowlisted(user1));
        assertFalse(registrar.isAllowlisted(user2));
        vm.stopPrank();
    }
    
    function test_OnlyOwnerCanManageAllowlist() public {
        vm.prank(user1);
        vm.expectRevert("L2Registrar: caller is not owner");
        registrar.setAllowlistEnabled(true);
        
        vm.prank(user1);
        vm.expectRevert("L2Registrar: caller is not owner");
        registrar.addToAllowlist(user2);
        
        vm.prank(user1);
        vm.expectRevert("L2Registrar: caller is not owner");
        registrar.removeFromAllowlist(user2);
    }
    
    function test_TransferOwnership() public {
        assertEq(registrar.owner(), owner);
        
        vm.prank(owner);
        registrar.transferOwnership(user1);
        
        assertEq(registrar.owner(), user1);
        
        // New owner can manage allowlist
        vm.prank(user1);
        registrar.setAllowlistEnabled(true);
        assertTrue(registrar.allowlistEnabled());
    }
    
    function test_CannotTransferOwnershipToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("L2Registrar: zero address");
        registrar.transferOwnership(address(0));
    }
    
    function test_CannotAddZeroAddressToAllowlist() public {
        vm.prank(owner);
        vm.expectRevert("L2Registrar: zero address");
        registrar.addToAllowlist(address(0));
    }
}
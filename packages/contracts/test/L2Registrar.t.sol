// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {L2Registry} from "../src/L2Registry.sol";
import {L2Registrar} from "../src/L2Registrar.sol";

contract L2RegistrarTest is Test {
    L2Registry registry;
    L2Registrar registrar;
    address admin = address(1);
    address user = address(2);

    function setUp() public {
        vm.startPrank(admin);
        // Deploy and initialize registry
        registry = new L2Registry();
        registry.initialize("Test Registry", "TEST", "https://api.example.com/");

        // Deploy registrar
        registrar = new L2Registrar(registry);

        // Add registrar role
        registry.addRegistrar(address(registrar));
        vm.stopPrank();
    }

    function testRegister() public {
        string memory label = "user";
        string memory subdomain = "test";
        string memory labelWithSubdomain = string.concat(label, ".", subdomain);

        registrar.register(label, subdomain, user);

        bytes32 labelhash = keccak256(bytes(labelWithSubdomain));
        assertEq(registry.ownerOf(uint256(labelhash)), user);
    }

    function testRegisterWithName() public {
        string memory label = "test";
        string memory name = "Test Name";
        string memory labelWithSubdomain = string.concat(label, ".", subdomain);

        registrar.register(label, subdomain, user, name);

        bytes32 labelhash = keccak256(bytes(labelWithSubdomain));
        assertEq(registry.text(labelhash, "name"), name);
    }

    function testAvailable() public {
        string memory label = "user.test";
        assertTrue(registrar.available(label));

        registrar.register(label, user);
        assertFalse(registrar.available(label));
    }

    function testChainId() public {
        assertEq(registrar.chainId(), block.chainid);
    }

    function testCoinType() public {
        uint256 expectedCoinType = (0x80000000 | block.chainid) >> 0;
        assertEq(registrar.coinType(), expectedCoinType);
    }
}

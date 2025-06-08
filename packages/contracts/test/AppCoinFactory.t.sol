// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/AppCoinFactory.sol";
import "../src/AppCoin.sol";

contract AppCoinFactoryTest is Test {
    AppCoinFactory public factory;
    address public owner;

    function setUp() public {
        owner = makeAddr("owner");
        vm.startPrank(owner);
        factory = new AppCoinFactory();
        vm.stopPrank();
    }

    function test_CreateAppCoin() public {
        vm.startPrank(owner);
        factory.createAppCoin("Test AppCoin", "TEST");

        address[] memory appCoins = factory.getAppCoinsByOwner(owner);
        assertEq(appCoins.length, 1);

        AppCoin appCoin = AppCoin(appCoins[0]);
        assertEq(appCoin.name(), "Test AppCoin");
        assertEq(appCoin.symbol(), "TEST");
        assertTrue(appCoin.admins(owner));
        vm.stopPrank();
    }

    function test_GetTotalAppCoins() public {
        vm.startPrank(owner);
        assertEq(factory.getTotalAppCoins(), 0);

        factory.createAppCoin("Test AppCoin 1", "TEST1");
        assertEq(factory.getTotalAppCoins(), 1);

        factory.createAppCoin("Test AppCoin 2", "TEST2");
        assertEq(factory.getTotalAppCoins(), 2);
        vm.stopPrank();
    }
}
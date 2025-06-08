// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/AppCoin.sol";

contract AppCoinTest is Test {
    AppCoin public appCoin;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        vm.startPrank(owner);
        appCoin = new AppCoin("Test AppCoin", "TEST", owner);
        vm.stopPrank();
    }

    function test_InitialSetup() public view {
        assertEq(appCoin.name(), "Test AppCoin");
        assertEq(appCoin.symbol(), "TEST");
        assertTrue(appCoin.admins(owner));
    }

    function test_AddAdmin() public {
        vm.startPrank(owner);
        appCoin.addAdmin(user1);
        assertTrue(appCoin.admins(user1));
        vm.stopPrank();
    }

    function test_RemoveAdmin() public {
        vm.startPrank(owner);
        appCoin.addAdmin(user1);
        appCoin.removeAdmin(user1);
        assertFalse(appCoin.admins(user1));
        vm.stopPrank();
    }

    function test_distributeCoin() public {
        vm.startPrank(owner);
        appCoin.distributeCoin(user1, 100);
        assertEq(appCoin.balanceOf(user1), 100);
        assertEq(appCoin.totalReceived(user1), 100);
        vm.stopPrank();
    }

    function test_Tip() public {
        vm.startPrank(owner);
        appCoin.distributeCoin(user1, 100);
        vm.stopPrank();

        vm.startPrank(user1);
        appCoin.tip(user2, 50);
        assertEq(appCoin.balanceOf(user1), 50);
        assertEq(appCoin.balanceOf(user2), 50);
        assertEq(appCoin.totalReceived(user2), 50);
        vm.stopPrank();
    }

    function test_RedeemCoin() public {
        vm.startPrank(owner);
        appCoin.distributeCoin(user1, 100);
        vm.stopPrank();

        vm.startPrank(user1);
        appCoin.redeemCoinForReward(50);
        assertEq(appCoin.balanceOf(user1), 50);
        vm.stopPrank();
    }
}

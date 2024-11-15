
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/AppPoint.sol";

contract AppPointTest is Test {
    AppPoint appPoint;

    function setUp() public {
        appPoint = new AppPoint("TestPoint", "TP", address(this));
    }

    function testAddAdmin() public {
        address newAdmin = address(0x123);
        appPoint.addAdmin(newAdmin);
        assertTrue(appPoint.admins(newAdmin));
    }

    function testRemoveAdmin() public {
        address newAdmin = address(0x123);
        appPoint.addAdmin(newAdmin);
        appPoint.removeAdmin(newAdmin);
        assertFalse(appPoint.admins(newAdmin));
    }

    function testDistributePoints() public {
        address recipient = address(0x456);
        uint256 amount = 1000;

        appPoint.addAdmin(address(this));
        appPoint.distributePoints(recipient, amount);

        assertEq(appPoint.balanceOf(recipient), amount);
        assertEq(appPoint.totalReceivedPoints(recipient), amount);
    }

    function testTip() public {
        address recipient = address(0x456);
        uint256 amount = 1000;

        appPoint.addAdmin(address(this));
        appPoint.distributePoints(address(this), amount);
        appPoint.tip(recipient, amount);

        assertEq(appPoint.balanceOf(recipient), amount);
        assertEq(appPoint.totalReceivedPoints(recipient), amount);
    }

    function testRedeemPointsForReward() public {
        uint256 amount = 1000;

        appPoint.addAdmin(address(this));
        appPoint.distributePoints(address(this), amount);
        appPoint.redeemPointsForReward(amount);

        assertEq(appPoint.balanceOf(address(this)), 0);
    }
}
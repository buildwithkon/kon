
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/AppPointFactory.sol";

contract AppPointFactoryTest is Test {
    AppPointFactory factory;

    function setUp() public {
        factory = new AppPointFactory();
    }

    function testCreateAppPoint() public {
        string memory name = "TestPoint";
        string memory symbol = "TP";

        factory.createAppPoint(name, symbol);

        address[] memory appPoints = factory.getAppPointsByOwner(address(this));
        assertEq(appPoints.length, 1);

        address appPointAddress = appPoints[0];
        assertTrue(appPointAddress != address(0));
    }

    function testGetTotalAppPoints() public {
        string memory name = "TestPoint";
        string memory symbol = "TP";

        factory.createAppPoint(name, symbol);
        factory.createAppPoint(name, symbol);

        uint256 totalAppPoints = factory.getTotalAppPoints();
        assertEq(totalAppPoints, 2);
    }
}
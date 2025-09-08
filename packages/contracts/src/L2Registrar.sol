// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";

import {IL2Registry} from "@namestonehq/durin/interfaces/IL2Registry.sol";

/// @dev This is an example registrar contract that is mean to be modified.
contract L2Registrar {
    using StringUtils for string;

    /// @notice Emitted when a new name is registered
    /// @param label The registered label (e.g. "name" in "name.eth")
    /// @param owner The owner of the newly registered name
    event NameRegistered(string indexed label, address indexed owner);

    /// @notice Emitted when allowlist mode is toggled
    event AllowlistModeChanged(bool enabled);

    /// @notice Emitted when an address is added to the allowlist
    event AddedToAllowlist(address indexed account);

    /// @notice Emitted when an address is removed from the allowlist
    event RemovedFromAllowlist(address indexed account);

    /// @notice Reference to the target registry contract
    IL2Registry public immutable registry;

    /// @notice The chainId for the current chain
    uint256 public chainId;

    /// @notice The coinType for the current chain (ENSIP-11)
    uint256 public immutable coinType;

    /// @notice The owner who can manage the allowlist
    address public owner;

    /// @notice Whether allowlist mode is enabled
    bool public allowlistEnabled;

    /// @notice Mapping of allowlisted addresses
    mapping(address => bool) public allowlist;

    /// @notice Initializes the registrar with a registry contract
    /// @param _registry Address of the L2Registry contract
    constructor(address _registry) {
        owner = msg.sender;
        allowlistEnabled = true;
        // Save the chainId in memory (can only access this in assembly)
        assembly {
            sstore(chainId.slot, chainid())
        }

        // Calculate the coinType for the current chain according to ENSIP-11
        coinType = (0x80000000 | chainId) >> 0;

        // Save the registry address
        registry = IL2Registry(_registry);
    }

    /// @notice Registers a new name
    /// @param label The label to register (e.g. "name" for "name.eth")
    /// @param nameOwner The address that will own the name
    function register(string calldata label, address nameOwner) external {
        // Check allowlist if enabled
        if (allowlistEnabled) {
            require(allowlist[msg.sender], "L2Registrar: caller not allowlisted");
        }

        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(nameOwner); // Convert address to bytes

        // Set the forward address for the current chain. This is needed for reverse resolution.
        // E.g. if this contract is deployed to Base, set an address for chainId 8453 which is
        // coinType 2147492101 according to ENSIP-11.
        registry.setAddr(node, coinType, addr);

        // Set the forward address for mainnet ETH (coinType 60) for easier debugging.
        registry.setAddr(node, 60, addr);

        // Register the name in the L2 registry
        registry.createSubnode(registry.baseNode(), label, nameOwner, new bytes[](0));
        emit NameRegistered(label, nameOwner);
    }

    /// @notice Checks if a given label is available for registration
    /// @dev Uses try-catch to handle the ERC721NonexistentToken error
    /// @param label The label to check availability for
    /// @return available True if the label can be registered, false if already taken
    function available(string calldata label) external view returns (bool) {
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            return false;
        } catch {
            if (label.strlen() >= 3) {
                return true;
            }
            return false;
        }
    }

    /// @notice Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "L2Registrar: caller is not owner");
        _;
    }

    /// @notice Sets the allowlist mode
    /// @param enabled Whether to enable or disable allowlist mode
    function setAllowlistEnabled(bool enabled) external onlyOwner {
        allowlistEnabled = enabled;
        emit AllowlistModeChanged(enabled);
    }

    /// @notice Adds an address to the allowlist
    /// @param account The address to add to the allowlist
    function addToAllowlist(address account) external onlyOwner {
        require(account != address(0), "L2Registrar: zero address");
        allowlist[account] = true;
        emit AddedToAllowlist(account);
    }

    /// @notice Adds multiple addresses to the allowlist
    /// @param accounts The addresses to add to the allowlist
    function addToAllowlistBatch(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "L2Registrar: zero address");
            allowlist[accounts[i]] = true;
            emit AddedToAllowlist(accounts[i]);
        }
    }

    /// @notice Removes an address from the allowlist
    /// @param account The address to remove from the allowlist
    function removeFromAllowlist(address account) external onlyOwner {
        allowlist[account] = false;
        emit RemovedFromAllowlist(account);
    }

    /// @notice Removes multiple addresses from the allowlist
    /// @param accounts The addresses to remove from the allowlist
    function removeFromAllowlistBatch(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            allowlist[accounts[i]] = false;
            emit RemovedFromAllowlist(accounts[i]);
        }
    }

    /// @notice Transfers ownership to a new address
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "L2Registrar: zero address");
        owner = newOwner;
    }

    /// @notice Checks if an address is allowlisted
    /// @param account The address to check
    /// @return Whether the address is allowlisted
    function isAllowlisted(address account) external view returns (bool) {
        return allowlist[account];
    }

    function _labelToNode(string calldata label) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}

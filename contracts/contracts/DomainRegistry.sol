// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./EntityRegistry.sol";

/**
 * @title DomainRegistry
 * @dev Registry for official domains of trusted entities
 * @notice This contract manages the whitelist of official domains for each entity
 */
contract DomainRegistry is Ownable, ReentrancyGuard {
    
    EntityRegistry public immutable entityRegistry;
    
    struct DomainInfo {
        uint256 entityId;
        string domain;
        bool isActive;
        uint256 addedAt;
        uint256 updatedAt;
    }
    
    // Mappings
    mapping(bytes32 => DomainInfo) public domains; // domainHash => DomainInfo
    mapping(uint256 => bytes32[]) public entityDomains; // entityId => domainHashes[]
    mapping(bytes32 => bool) public domainExists; // domainHash => exists
    
    // Events
    event DomainAdded(
        uint256 indexed entityId,
        bytes32 indexed domainHash,
        string domain
    );
    
    event DomainRemoved(
        uint256 indexed entityId,
        bytes32 indexed domainHash,
        string domain
    );
    
    event DomainStatusChanged(
        bytes32 indexed domainHash,
        bool isActive
    );
    
    // Modifiers
    modifier onlyEntityOwner(uint256 entityId) {
        EntityRegistry.Entity memory entity = entityRegistry.getEntity(entityId);
        require(entity.owner == msg.sender, "Not entity owner");
        require(entity.isActive, "Entity is not active");
        _;
    }
    
    modifier validDomain(string memory domain) {
        require(bytes(domain).length > 0, "Domain cannot be empty");
        require(bytes(domain).length <= 253, "Domain too long");
        _;
    }
    
    constructor(address _entityRegistry) {
        require(_entityRegistry != address(0), "Invalid EntityRegistry address");
        entityRegistry = EntityRegistry(_entityRegistry);
    }
    
    /**
     * @dev Add a domain to an entity's whitelist
     * @param entityId ID of the entity
     * @param domain Domain to add (normalized, lowercase)
     */
    function addDomain(
        uint256 entityId,
        string memory domain
    ) external onlyEntityOwner(entityId) validDomain(domain) nonReentrant {
        bytes32 domainHash = keccak256(abi.encodePacked(_normalizeDomain(domain)));
        
        require(!domainExists[domainHash], "Domain already exists");
        
        domains[domainHash] = DomainInfo({
            entityId: entityId,
            domain: domain,
            isActive: true,
            addedAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        entityDomains[entityId].push(domainHash);
        domainExists[domainHash] = true;
        
        emit DomainAdded(entityId, domainHash, domain);
    }
    
    /**
     * @dev Remove a domain from an entity's whitelist
     * @param entityId ID of the entity
     * @param domain Domain to remove
     */
    function removeDomain(
        uint256 entityId,
        string memory domain
    ) external onlyEntityOwner(entityId) validDomain(domain) nonReentrant {
        bytes32 domainHash = keccak256(abi.encodePacked(_normalizeDomain(domain)));
        
        require(domainExists[domainHash], "Domain does not exist");
        require(domains[domainHash].entityId == entityId, "Domain not owned by entity");
        
        // Remove from entityDomains array
        bytes32[] storage entityDomainList = entityDomains[entityId];
        for (uint256 i = 0; i < entityDomainList.length; i++) {
            if (entityDomainList[i] == domainHash) {
                entityDomainList[i] = entityDomainList[entityDomainList.length - 1];
                entityDomainList.pop();
                break;
            }
        }
        
        string memory domainName = domains[domainHash].domain;
        delete domains[domainHash];
        domainExists[domainHash] = false;
        
        emit DomainRemoved(entityId, domainHash, domainName);
    }
    
    /**
     * @dev Set domain active status (admin only)
     * @param domain Domain to update
     * @param isActive New active status
     */
    function setDomainStatus(
        string memory domain,
        bool isActive
    ) external onlyOwner validDomain(domain) {
        bytes32 domainHash = keccak256(abi.encodePacked(_normalizeDomain(domain)));
        
        require(domainExists[domainHash], "Domain does not exist");
        
        domains[domainHash].isActive = isActive;
        domains[domainHash].updatedAt = block.timestamp;
        
        emit DomainStatusChanged(domainHash, isActive);
    }
    
    /**
     * @dev Check if a domain is official and active
     * @param domain Domain to check
     * @return isOfficial True if domain is in whitelist and active
     * @return entityId ID of the entity that owns the domain
     */
    function isOfficial(string memory domain) external view returns (bool isOfficial, uint256 entityId) {
        bytes32 domainHash = keccak256(abi.encodePacked(_normalizeDomain(domain)));
        
        if (!domainExists[domainHash]) {
            return (false, 0);
        }
        
        DomainInfo memory domainInfo = domains[domainHash];
        
        if (!domainInfo.isActive) {
            return (false, domainInfo.entityId);
        }
        
        // Check if entity is still active
        if (!entityRegistry.isEntityActive(domainInfo.entityId)) {
            return (false, domainInfo.entityId);
        }
        
        return (true, domainInfo.entityId);
    }
    
    /**
     * @dev Get domain information
     * @param domain Domain to query
     */
    function getDomainInfo(string memory domain) external view returns (DomainInfo memory) {
        bytes32 domainHash = keccak256(abi.encodePacked(_normalizeDomain(domain)));
        require(domainExists[domainHash], "Domain does not exist");
        return domains[domainHash];
    }
    
    /**
     * @dev Get all domains for an entity
     * @param entityId ID of the entity
     */
    function getEntityDomains(uint256 entityId) external view returns (string[] memory) {
        bytes32[] memory domainHashes = entityDomains[entityId];
        string[] memory domainList = new string[](domainHashes.length);
        
        for (uint256 i = 0; i < domainHashes.length; i++) {
            domainList[i] = domains[domainHashes[i]].domain;
        }
        
        return domainList;
    }
    
    /**
     * @dev Get count of domains for an entity
     * @param entityId ID of the entity
     */
    function getEntityDomainCount(uint256 entityId) external view returns (uint256) {
        return entityDomains[entityId].length;
    }
    
    /**
     * @dev Normalize domain (convert to lowercase, remove www prefix)
     * @param domain Raw domain string
     */
    function _normalizeDomain(string memory domain) internal pure returns (string memory) {
        bytes memory domainBytes = bytes(domain);
        
        // Convert to lowercase
        for (uint256 i = 0; i < domainBytes.length; i++) {
            if (domainBytes[i] >= 0x41 && domainBytes[i] <= 0x5A) {
                domainBytes[i] = bytes1(uint8(domainBytes[i]) + 32);
            }
        }
        
        string memory normalized = string(domainBytes);
        
        // Remove www. prefix if present
        if (bytes(normalized).length > 4) {
            if (
                bytes(normalized)[0] == 'w' &&
                bytes(normalized)[1] == 'w' &&
                bytes(normalized)[2] == 'w' &&
                bytes(normalized)[3] == '.'
            ) {
                bytes memory withoutWww = new bytes(bytes(normalized).length - 4);
                for (uint256 i = 0; i < withoutWww.length; i++) {
                    withoutWww[i] = bytes(normalized)[i + 4];
                }
                normalized = string(withoutWww);
            }
        }
        
        return normalized;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title EntityRegistry
 * @dev Registry for financial institutions and trusted entities
 * @notice This contract manages the registration of banks, fintechs, and other trusted entities
 */
contract EntityRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _entityIds;
    
    struct Entity {
        uint256 id;
        string name;
        address owner;
        string website;
        string country;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Mappings
    mapping(uint256 => Entity) public entities;
    mapping(address => uint256) public ownerToEntity;
    mapping(string => bool) public nameExists;
    
    // Events
    event EntityRegistered(
        uint256 indexed entityId,
        string name,
        address indexed owner,
        string website,
        string country
    );
    
    event EntityUpdated(
        uint256 indexed entityId,
        string name,
        string website
    );
    
    event EntityOwnerChanged(
        uint256 indexed entityId,
        address indexed oldOwner,
        address indexed newOwner
    );
    
    event EntityStatusChanged(
        uint256 indexed entityId,
        bool isActive
    );
    
    // Modifiers
    modifier onlyEntityOwner(uint256 entityId) {
        require(entities[entityId].owner == msg.sender, "Not entity owner");
        _;
    }
    
    modifier entityExists(uint256 entityId) {
        require(entities[entityId].id != 0, "Entity does not exist");
        _;
    }
    
    /**
     * @dev Register a new trusted entity
     * @param name Name of the entity
     * @param owner Address that will manage this entity
     * @param website Official website of the entity
     * @param country Country code (ISO 3166-1 alpha-2)
     */
    function registerEntity(
        string memory name,
        address owner,
        string memory website,
        string memory country
    ) external onlyOwner nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(owner != address(0), "Invalid owner address");
        require(!nameExists[name], "Entity name already exists");
        require(ownerToEntity[owner] == 0, "Owner already has an entity");
        
        _entityIds.increment();
        uint256 entityId = _entityIds.current();
        
        entities[entityId] = Entity({
            id: entityId,
            name: name,
            owner: owner,
            website: website,
            country: country,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        ownerToEntity[owner] = entityId;
        nameExists[name] = true;
        
        emit EntityRegistered(entityId, name, owner, website, country);
        
        return entityId;
    }
    
    /**
     * @dev Update entity information
     * @param entityId ID of the entity to update
     * @param name New name (empty string to keep current)
     * @param website New website (empty string to keep current)
     */
    function updateEntity(
        uint256 entityId,
        string memory name,
        string memory website
    ) external onlyEntityOwner(entityId) {
        Entity storage entity = entities[entityId];
        
        if (bytes(name).length > 0 && keccak256(bytes(name)) != keccak256(bytes(entity.name))) {
            require(!nameExists[name], "Entity name already exists");
            nameExists[entity.name] = false;
            nameExists[name] = true;
            entity.name = name;
        }
        
        if (bytes(website).length > 0) {
            entity.website = website;
        }
        
        entity.updatedAt = block.timestamp;
        
        emit EntityUpdated(entityId, entity.name, entity.website);
    }
    
    /**
     * @dev Transfer entity ownership
     * @param entityId ID of the entity
     * @param newOwner New owner address
     */
    function transferEntityOwnership(
        uint256 entityId,
        address newOwner
    ) external onlyEntityOwner(entityId) {
        require(newOwner != address(0), "Invalid new owner");
        require(ownerToEntity[newOwner] == 0, "New owner already has an entity");
        
        Entity storage entity = entities[entityId];
        address oldOwner = entity.owner;
        
        entity.owner = newOwner;
        entity.updatedAt = block.timestamp;
        
        ownerToEntity[oldOwner] = 0;
        ownerToEntity[newOwner] = entityId;
        
        emit EntityOwnerChanged(entityId, oldOwner, newOwner);
    }
    
    /**
     * @dev Set entity active status
     * @param entityId ID of the entity
     * @param isActive New active status
     */
    function setEntityStatus(
        uint256 entityId,
        bool isActive
    ) external onlyOwner entityExists(entityId) {
        entities[entityId].isActive = isActive;
        entities[entityId].updatedAt = block.timestamp;
        
        emit EntityStatusChanged(entityId, isActive);
    }
    
    /**
     * @dev Get entity information
     * @param entityId ID of the entity
     */
    function getEntity(uint256 entityId) external view returns (Entity memory) {
        require(entities[entityId].id != 0, "Entity does not exist");
        return entities[entityId];
    }
    
    /**
     * @dev Get entity by owner address
     * @param owner Owner address
     */
    function getEntityByOwner(address owner) external view returns (Entity memory) {
        uint256 entityId = ownerToEntity[owner];
        require(entityId != 0, "No entity found for this owner");
        return entities[entityId];
    }
    
    /**
     * @dev Check if entity is active
     * @param entityId ID of the entity
     */
    function isEntityActive(uint256 entityId) external view returns (bool) {
        return entities[entityId].isActive;
    }
    
    /**
     * @dev Get total number of registered entities
     */
    function getTotalEntities() external view returns (uint256) {
        return _entityIds.current();
    }
}

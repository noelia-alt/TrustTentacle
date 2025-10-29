// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PhishingReports
 * @dev Community-driven phishing reports registry
 * @notice This contract manages phishing reports from the community
 */
contract PhishingReports is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _reportIds;
    
    struct Report {
        uint256 id;
        bytes32 urlHash;
        address reporter;
        string metadataCID; // IPFS CID with report details
        uint256 timestamp;
        bool isVerified;
        uint256 verifiedAt;
        address verifiedBy;
    }
    
    struct UrlStats {
        uint256 reportCount;
        uint256 verifiedReports;
        uint256 firstReportedAt;
        uint256 lastReportedAt;
        bool isBlacklisted;
    }
    
    // Mappings
    mapping(uint256 => Report) public reports;
    mapping(bytes32 => UrlStats) public urlStats;
    mapping(bytes32 => uint256[]) public urlReports; // urlHash => reportIds[]
    mapping(address => uint256) public reporterCounts;
    mapping(address => bool) public verifiers;
    mapping(address => uint256) public lastReportTime; // Rate limiting
    
    // Constants
    uint256 public constant MIN_REPORT_INTERVAL = 60; // 1 minute between reports per user
    uint256 public constant BLACKLIST_THRESHOLD = 3; // Reports needed for auto-blacklist
    
    // Events
    event PhishingReported(
        uint256 indexed reportId,
        bytes32 indexed urlHash,
        address indexed reporter,
        string metadataCID
    );
    
    event ReportVerified(
        uint256 indexed reportId,
        bytes32 indexed urlHash,
        address indexed verifier
    );
    
    event UrlBlacklisted(
        bytes32 indexed urlHash,
        uint256 reportCount
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier rateLimited() {
        require(
            block.timestamp >= lastReportTime[msg.sender] + MIN_REPORT_INTERVAL,
            "Rate limit exceeded"
        );
        _;
    }
    
    /**
     * @dev Report a phishing URL
     * @param url The suspicious URL
     * @param metadataCID IPFS CID containing report details (screenshots, description, etc.)
     */
    function reportPhishing(
        string memory url,
        string memory metadataCID
    ) external rateLimited nonReentrant returns (uint256) {
        require(bytes(url).length > 0, "URL cannot be empty");
        require(bytes(metadataCID).length > 0, "Metadata CID required");
        
        bytes32 urlHash = keccak256(abi.encodePacked(_normalizeUrl(url)));
        
        _reportIds.increment();
        uint256 reportId = _reportIds.current();
        
        reports[reportId] = Report({
            id: reportId,
            urlHash: urlHash,
            reporter: msg.sender,
            metadataCID: metadataCID,
            timestamp: block.timestamp,
            isVerified: false,
            verifiedAt: 0,
            verifiedBy: address(0)
        });
        
        // Update URL stats
        UrlStats storage stats = urlStats[urlHash];
        stats.reportCount++;
        reporterCounts[msg.sender]++;
        lastReportTime[msg.sender] = block.timestamp;
        
        if (stats.firstReportedAt == 0) {
            stats.firstReportedAt = block.timestamp;
        }
        stats.lastReportedAt = block.timestamp;
        
        // Add to URL reports
        urlReports[urlHash].push(reportId);
        
        // Auto-blacklist if threshold reached
        if (stats.reportCount >= BLACKLIST_THRESHOLD && !stats.isBlacklisted) {
            stats.isBlacklisted = true;
            emit UrlBlacklisted(urlHash, stats.reportCount);
        }
        
        emit PhishingReported(reportId, urlHash, msg.sender, metadataCID);
        
        return reportId;
    }
    
    /**
     * @dev Verify a phishing report
     * @param reportId ID of the report to verify
     */
    function verifyReport(uint256 reportId) external onlyVerifier {
        require(reports[reportId].id != 0, "Report does not exist");
        require(!reports[reportId].isVerified, "Report already verified");
        
        Report storage report = reports[reportId];
        report.isVerified = true;
        report.verifiedAt = block.timestamp;
        report.verifiedBy = msg.sender;
        
        // Update URL stats
        urlStats[report.urlHash].verifiedReports++;
        
        emit ReportVerified(reportId, report.urlHash, msg.sender);
    }
    
    /**
     * @dev Add a verifier
     * @param verifier Address to add as verifier
     */
    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        require(!verifiers[verifier], "Already a verifier");
        
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    /**
     * @dev Remove a verifier
     * @param verifier Address to remove from verifiers
     */
    function removeVerifier(address verifier) external onlyOwner {
        require(verifiers[verifier], "Not a verifier");
        
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }
    
    /**
     * @dev Check if URL is reported as phishing
     * @param url URL to check
     * @return isReported True if URL has been reported
     * @return reportCount Number of reports for this URL
     * @return isBlacklisted True if URL is blacklisted
     */
    function isPhishing(string memory url) external view returns (
        bool isReported,
        uint256 reportCount,
        bool isBlacklisted
    ) {
        bytes32 urlHash = keccak256(abi.encodePacked(_normalizeUrl(url)));
        UrlStats memory stats = urlStats[urlHash];
        
        return (
            stats.reportCount > 0,
            stats.reportCount,
            stats.isBlacklisted
        );
    }
    
    /**
     * @dev Get URL statistics
     * @param url URL to query
     */
    function getUrlStats(string memory url) external view returns (UrlStats memory) {
        bytes32 urlHash = keccak256(abi.encodePacked(_normalizeUrl(url)));
        return urlStats[urlHash];
    }
    
    /**
     * @dev Get report details
     * @param reportId ID of the report
     */
    function getReport(uint256 reportId) external view returns (Report memory) {
        require(reports[reportId].id != 0, "Report does not exist");
        return reports[reportId];
    }
    
    /**
     * @dev Get all reports for a URL
     * @param url URL to query
     */
    function getUrlReports(string memory url) external view returns (uint256[] memory) {
        bytes32 urlHash = keccak256(abi.encodePacked(_normalizeUrl(url)));
        return urlReports[urlHash];
    }
    
    /**
     * @dev Get recent reports (last N reports)
     * @param count Number of recent reports to return
     */
    function getRecentReports(uint256 count) external view returns (Report[] memory) {
        uint256 totalReports = _reportIds.current();
        uint256 returnCount = count > totalReports ? totalReports : count;
        
        Report[] memory recentReports = new Report[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 reportId = totalReports - i;
            recentReports[i] = reports[reportId];
        }
        
        return recentReports;
    }
    
    /**
     * @dev Get total number of reports
     */
    function getTotalReports() external view returns (uint256) {
        return _reportIds.current();
    }
    
    /**
     * @dev Normalize URL for consistent hashing
     * @param url Raw URL string
     */
    function _normalizeUrl(string memory url) internal pure returns (string memory) {
        bytes memory urlBytes = bytes(url);
        
        // Convert to lowercase
        for (uint256 i = 0; i < urlBytes.length; i++) {
            if (urlBytes[i] >= 0x41 && urlBytes[i] <= 0x5A) {
                urlBytes[i] = bytes1(uint8(urlBytes[i]) + 32);
            }
        }
        
        string memory normalized = string(urlBytes);
        
        // Remove trailing slash if present
        if (bytes(normalized).length > 0 && bytes(normalized)[bytes(normalized).length - 1] == '/') {
            bytes memory withoutSlash = new bytes(bytes(normalized).length - 1);
            for (uint256 i = 0; i < withoutSlash.length; i++) {
                withoutSlash[i] = bytes(normalized)[i];
            }
            normalized = string(withoutSlash);
        }
        
        return normalized;
    }
}

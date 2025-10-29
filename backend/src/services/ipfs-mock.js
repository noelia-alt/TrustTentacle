// Mock IPFS Service - Temporary until ipfs-http-client is compatible with Node.js 22
const crypto = require('crypto');

class IPFSService {
  constructor() {
    this.mockStorage = new Map();
    console.log('📦 IPFS Service: Using mock mode (Node.js 22 compatibility)');
  }

  async initialize() {
    console.log('✅ IPFS mock service initialized');
    return true;
  }

  // Upload JSON data to IPFS (mock)
  async uploadJSON(data) {
    try {
      const jsonString = JSON.stringify(data);
      const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
      const mockCID = `Qm${hash.substring(0, 44)}`;
      
      this.mockStorage.set(mockCID, data);
      
      console.log(`📤 Mock IPFS upload: ${mockCID}`);
      return mockCID;
    } catch (error) {
      console.error('Error in mock IPFS upload:', error);
      throw error;
    }
  }

  // Get JSON data from IPFS (mock)
  async getJSON(cid) {
    try {
      if (this.mockStorage.has(cid)) {
        console.log(`📥 Mock IPFS retrieve: ${cid}`);
        return this.mockStorage.get(cid);
      }
      
      // Return mock data if not found
      console.log(`📥 Mock IPFS retrieve (not found, returning mock): ${cid}`);
      return {
        url: 'example.com',
        timestamp: Date.now(),
        reporter: '0x0000000000000000000000000000000000000000',
        evidence: 'Mock evidence data'
      };
    } catch (error) {
      console.error('Error in mock IPFS retrieve:', error);
      throw error;
    }
  }

  // Upload file to IPFS (mock)
  async uploadFile(fileBuffer, filename) {
    try {
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const mockCID = `Qm${hash.substring(0, 44)}`;
      
      this.mockStorage.set(mockCID, { filename, size: fileBuffer.length });
      
      console.log(`📤 Mock IPFS file upload: ${filename} -> ${mockCID}`);
      return mockCID;
    } catch (error) {
      console.error('Error in mock IPFS file upload:', error);
      throw error;
    }
  }

  // Get gateway URL for CID
  getGatewayURL(cid) {
    return `https://ipfs.io/ipfs/${cid}`;
  }

  // Pin content (mock - does nothing)
  async pin(cid) {
    console.log(`📌 Mock IPFS pin: ${cid}`);
    return true;
  }

  // Unpin content (mock - does nothing)
  async unpin(cid) {
    console.log(`📌 Mock IPFS unpin: ${cid}`);
    return true;
  }

  // Check if service is ready
  isReady() {
    return true;
  }
}

module.exports = new IPFSService();

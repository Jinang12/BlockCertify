const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const input = Buffer.from(
      String(this.index) + this.previousHash + this.timestamp + JSON.stringify(this.data),
      'utf8'
    );
    return sha256Hex(input);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.initializeBlockchain();
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), { 
      certificate_hash: '0',
      company_name: 'Genesis Block'
    }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
    this.saveChainToFile(); 
  }

  initializeBlockchain() {
    const filePath = path.join(__dirname, 'blockchain.json');
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Reconstruct the blockchain from file
        this.chain = parsedData.map(blockData => {
          const block = new Block(
            blockData.index,
            blockData.timestamp,
            blockData.data,
            blockData.previousHash
          );
          block.hash = blockData.hash;
          return block;
        });
        
        console.log('Blockchain loaded from file');
      } else {
        // If file doesn't exist, create it with genesis block
        this.saveChainToFile();
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      // In case of error, start with just the genesis block
      this.chain = [this.createGenesisBlock()];
    }
  }

  saveChainToFile() {
    const filePath = path.join(__dirname, 'blockchain.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.chain, null, 2));
    } catch (error) {
      console.error('Error saving blockchain to file:', error);
    }
  }

  async verifyCertificate(fileBuffer) {
    try {
      // Calculate hash of the uploaded file
      const fileHash = sha256Hex(fileBuffer);
      console.log('Verifying certificate with hash:', fileHash);
      console.log('Blockchain has', this.chain.length, 'blocks');
      
      // Check if hash exists in the blockchain (skip genesis block)
      for (let i = 1; i < this.chain.length; i++) {
        const block = this.chain[i];
        console.log(`Block ${i} hash:`, block.data.certificate_hash);
        if (block.data.certificate_hash === fileHash) {
          console.log('Certificate FOUND in block', i);
          return {
            valid: true,
            block: {
              index: block.index,
              timestamp: block.timestamp,
              companyName: block.data.company_name,
              blockHash: block.hash
            }
          };
        }
      }
      
      console.log('Certificate NOT FOUND in blockchain');
      return { valid: false };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw new Error('Failed to verify certificate');
    }
  }

  async issueCertificate(certificateData) {
    try {
      const { fileBuffer, companyName } = certificateData;
      const certificateHash = sha256Hex(fileBuffer);
      console.log('Issuing certificate for company:', companyName);
      console.log('Certificate hash:', certificateHash);
      console.log('File size:', fileBuffer.length, 'bytes');

      // Prevent duplicate issuance of the same file content
      const existing = this.chain.find((b, idx) => idx > 0 && b.data && b.data.certificate_hash === certificateHash);
      if (existing) {
        console.warn('Duplicate certificate hash detected. Existing block index:', existing.index);
        return {
          success: false,
          duplicate: true,
          message: 'Certificate already issued',
          block: {
            index: existing.index,
            timestamp: existing.timestamp,
            hash: existing.hash,
            previousHash: existing.previousHash,
            data: existing.data
          }
        };
      }
      
      // Create new block
      const newBlock = new Block(
        this.chain.length,
        new Date().toISOString(),
        {
          certificate_hash: certificateHash,
          company_name: companyName
        }
      );
      
      // Add block to chain
      this.addBlock(newBlock);
      
      return {
        success: true,
        block: {
          index: newBlock.index,
          timestamp: newBlock.timestamp,
          hash: newBlock.hash,
          previousHash: newBlock.previousHash,
          data: newBlock.data
        }
      };
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw new Error('Failed to issue certificate');
    }
  }

  getBlockchain() {
    return this.chain;
  }
}

module.exports = Blockchain;

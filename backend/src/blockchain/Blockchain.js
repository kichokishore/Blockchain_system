const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  constructor(fromAddress, toAddress, amount, fee = 0, data = null, type = 'TRANSFER') {
    this.id = uuidv4();
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = parseFloat(amount);
    this.fee = parseFloat(fee);
    this.data = data;
    this.type = type; // TRANSFER, CONTRACT_DEPLOY, CONTRACT_CALL, REWARD
    this.timestamp = Date.now();
    this.signature = null;
    this.status = 'PENDING';
  }

  calculateHash() {
    return CryptoJS.SHA256(
      this.fromAddress + this.toAddress + this.amount + this.fee +
      this.timestamp + this.id + JSON.stringify(this.data)
    ).toString();
  }

  sign(signingKey) {
    if (signingKey.getPublic('hex') !== this.fromAddress && this.fromAddress !== null) {
      throw new Error('Cannot sign transactions for other wallets!');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
    return this;
  }

  isValid() {
    if (this.fromAddress === null) return true; // Mining reward
    if (!this.signature || this.signature.length === 0) return false;
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      fee: this.fee,
      data: this.data,
      type: this.type,
      timestamp: this.timestamp,
      signature: this.signature,
      status: this.status
    };
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash = '', miner = 'SYSTEM') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.miner = miner;
    this.nonce = 0;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
  }

  calculateMerkleRoot() {
    if (this.transactions.length === 0) return '0'.repeat(64);
    let hashes = this.transactions.map(tx =>
      CryptoJS.SHA256(JSON.stringify(tx)).toString()
    );
    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) hashes.push(hashes[hashes.length - 1]);
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        newHashes.push(CryptoJS.SHA256(hashes[i] + hashes[i + 1]).toString());
      }
      hashes = newHashes;
    }
    return hashes[0];
  }

  calculateHash() {
    return CryptoJS.SHA256(
      this.index + this.previousHash + this.timestamp +
      JSON.stringify(this.transactions) + this.nonce + this.merkleRoot + this.miner
    ).toString();
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');
    const startTime = Date.now();
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    const mineTime = Date.now() - startTime;
    return { nonce: this.nonce, mineTime };
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid || (typeof tx.isValid === 'function' && !tx.isValid())) {
        return false;
      }
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.miningReward = 50;
    this.blockSize = 10; // Max transactions per block
    this.smartContracts = new Map();
    this.networkStats = {
      totalTransactions: 0,
      totalVolume: 0,
      totalBlocks: 1,
      networkHashRate: 0
    };
  }

  createGenesisBlock() {
    const genesis = new Block(0, Date.now(), [], '0', 'GENESIS');
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    // Select transactions up to block size
    const txsToMine = this.pendingTransactions.slice(0, this.blockSize);

    // Add mining reward
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0, null, 'REWARD');
    rewardTx.status = 'CONFIRMED';
    txsToMine.push(rewardTx);

    const block = new Block(
      this.chain.length,
      Date.now(),
      txsToMine,
      this.getLatestBlock().hash,
      miningRewardAddress
    );

    const { nonce, mineTime } = block.mineBlock(this.difficulty);

    // Mark transactions as confirmed
    txsToMine.forEach(tx => { tx.status = 'CONFIRMED'; });

    this.chain.push(block);

    // Remove mined transactions from pending
    this.pendingTransactions = this.pendingTransactions.slice(this.blockSize);

    // Update stats
    this.networkStats.totalBlocks++;
    this.networkStats.totalTransactions += txsToMine.length;
    this.networkStats.networkHashRate = Math.floor(nonce / (mineTime / 1000)) || 0;

    const fees = txsToMine.reduce((sum, tx) => sum + (tx.fee || 0), 0);

    return { block, nonce, mineTime, fees };
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress && !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }
    if (!transaction.isValid || (typeof transaction.isValid === 'function' && !transaction.isValid())) {
      throw new Error('Cannot add invalid transaction to chain');
    }
    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }
    if (transaction.fromAddress !== null) {
      const senderBalance = this.getBalanceOfAddress(transaction.fromAddress);
      const totalCost = transaction.amount + (transaction.fee || 0);
      if (senderBalance < totalCost) {
        throw new Error(`Insufficient balance. Available: ${senderBalance}, Required: ${totalCost}`);
      }
    }
    transaction.status = 'PENDING';
    this.pendingTransactions.push(transaction);
    this.networkStats.totalVolume += transaction.amount;
    return transaction;
  }

  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount + (trans.fee || 0);
        }
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }
    // Also account for pending transactions
    for (const trans of this.pendingTransactions) {
      if (trans.fromAddress === address) {
        balance -= trans.amount + (trans.fee || 0);
      }
    }
    return parseFloat(balance.toFixed(8));
  }

  getAllTransactionsForAddress(address) {
    const txs = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push({ ...tx, blockIndex: block.index, blockHash: block.hash });
        }
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.fromAddress === address || tx.toAddress === address) {
        txs.push({ ...tx, blockIndex: null, blockHash: null });
      }
    }
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTransactionById(txId) {
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.id === txId) {
          return { ...tx, blockIndex: block.index, blockHash: block.hash, confirmations: this.chain.length - block.index };
        }
      }
    }
    const pending = this.pendingTransactions.find(tx => tx.id === txId);
    if (pending) return { ...pending, blockIndex: null, confirmations: 0 };
    return null;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      if (currentBlock.previousHash !== previousBlock.hash) return false;
    }
    return true;
  }

  getBlockByIndex(index) {
    return this.chain[index] || null;
  }

  getBlockByHash(hash) {
    return this.chain.find(b => b.hash === hash) || null;
  }

  // Smart Contract System
  deployContract(ownerAddress, contractCode, contractName, initialState = {}) {
    const contractId = 'SC_' + uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
    const contract = {
      id: contractId,
      name: contractName,
      owner: ownerAddress,
      code: contractCode,
      state: initialState,
      deployedAt: Date.now(),
      transactions: [],
      abi: this.parseContractABI(contractCode)
    };
    this.smartContracts.set(contractId, contract);
    // Record deployment transaction
    const tx = new Transaction(ownerAddress, contractId, 0, 0, { action: 'DEPLOY', contractName }, 'CONTRACT_DEPLOY');
    tx.status = 'CONFIRMED';
    this.pendingTransactions.push(tx);
    return contract;
  }

  callContract(contractId, callerAddress, method, params = [], value = 0) {
    const contract = this.smartContracts.get(contractId);
    if (!contract) throw new Error('Contract not found');

    const result = this.executeContractMethod(contract, method, params, callerAddress, value);

    const tx = new Transaction(callerAddress, contractId, value, 0.001,
      { action: 'CALL', method, params, result }, 'CONTRACT_CALL');
    tx.status = 'CONFIRMED';
    contract.transactions.push(tx.id);
    this.pendingTransactions.push(tx);

    return { result, transaction: tx };
  }

  executeContractMethod(contract, method, params, caller, value) {
    // Simulated contract execution
    const { state } = contract;

    if (method === 'transfer' && params.length >= 2) {
      const [to, amount] = params;
      state.balances = state.balances || {};
      state.balances[caller] = (state.balances[caller] || 0) - amount;
      state.balances[to] = (state.balances[to] || 0) + amount;
      return { success: true, from: caller, to, amount };
    }

    if (method === 'getBalance' && params.length >= 1) {
      state.balances = state.balances || {};
      return { balance: state.balances[params[0]] || 0 };
    }

    if (method === 'store' && params.length >= 2) {
      state.storage = state.storage || {};
      state.storage[params[0]] = params[1];
      return { success: true, key: params[0], value: params[1] };
    }

    if (method === 'retrieve' && params.length >= 1) {
      state.storage = state.storage || {};
      return { value: state.storage[params[0]] };
    }

    if (method === 'addFunds') {
      state.treasury = (state.treasury || 0) + value;
      return { success: true, treasury: state.treasury };
    }

    return { success: true, called: method, params };
  }

  parseContractABI(code) {
    // Extract function signatures from contract code string
    const functions = [];
    const regex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      functions.push({
        name: match[1],
        inputs: match[2].split(',').filter(p => p.trim()).map(p => ({ type: p.trim() }))
      });
    }
    return functions;
  }

  getNetworkStats() {
    const totalTxVolume = this.chain.reduce((sum, block) =>
      sum + block.transactions.reduce((s, tx) => s + (tx.amount || 0), 0), 0);

    return {
      ...this.networkStats,
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      isValid: this.isChainValid(),
      totalTxVolume: parseFloat(totalTxVolume.toFixed(8)),
      smartContracts: this.smartContracts.size,
      lastBlockTime: this.getLatestBlock().timestamp
    };
  }
}

// Singleton instance
const blockchain = new Blockchain();

// Seed with initial blocks for demo
(function seedBlockchain() {
  const SYSTEM = 'SYSTEM_GENESIS_ADDRESS';
  // Fund some demo wallets via pending then mine
  const seedAddresses = [
    'DEMO_WALLET_ALICE_001',
    'DEMO_WALLET_BOB_002',
    'DEMO_WALLET_CHARLIE_003'
  ];
  seedAddresses.forEach(addr => {
    const tx = new Transaction(null, addr, 1000, 0, null, 'REWARD');
    tx.status = 'PENDING';
    blockchain.pendingTransactions.push(tx);
  });
  blockchain.minePendingTransactions(SYSTEM);

  // Deploy a sample smart contract
  const sampleContract = `
contract TokenVault {
  mapping(address => uint256) balances;
  uint256 treasury;

  function transfer(address to, uint256 amount) public returns (bool) {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    balances[to] += amount;
    return true;
  }

  function getBalance(address account) public view returns (uint256) {
    return balances[account];
  }

  function addFunds() public payable {
    treasury += msg.value;
  }

  function store(string key, string value) public {
    storage[key] = value;
  }

  function retrieve(string key) public view returns (string) {
    return storage[key];
  }
}`;
  blockchain.deployContract('DEMO_WALLET_ALICE_001', sampleContract, 'TokenVault', { balances: {}, treasury: 0 });
  blockchain.minePendingTransactions(SYSTEM);
})();

module.exports = { Blockchain, Block, Transaction, blockchain };

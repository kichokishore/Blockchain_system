const { blockchain } = require('../blockchain/Blockchain');

exports.getChain = (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const total = blockchain.chain.length;
  const start = Math.max(0, total - page * limit);
  const end = total - (page - 1) * limit;
  const blocks = blockchain.chain.slice(start, end).reverse().map(block => ({
    index: block.index,
    hash: block.hash,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    nonce: block.nonce,
    miner: block.miner,
    merkleRoot: block.merkleRoot,
    transactionCount: block.transactions.length,
    size: JSON.stringify(block).length
  }));

  res.json({ success: true, data: { blocks, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

exports.getBlock = (req, res) => {
  const { identifier } = req.params;
  let block;
  if (/^\d+$/.test(identifier)) {
    block = blockchain.getBlockByIndex(parseInt(identifier));
  } else {
    block = blockchain.getBlockByHash(identifier);
  }
  if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

  res.json({
    success: true,
    data: {
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      nonce: block.nonce,
      miner: block.miner,
      merkleRoot: block.merkleRoot,
      transactions: block.transactions,
      size: JSON.stringify(block).length,
      confirmations: blockchain.chain.length - block.index
    }
  });
};

exports.getNetworkStats = (req, res) => {
  const stats = blockchain.getNetworkStats();
  res.json({ success: true, data: stats });
};

exports.validateChain = (req, res) => {
  const isValid = blockchain.isChainValid();
  res.json({
    success: true,
    data: {
      isValid,
      chainLength: blockchain.chain.length,
      lastChecked: Date.now(),
      message: isValid ? 'Blockchain integrity verified' : 'Chain integrity compromised!'
    }
  });
};

exports.search = (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

  const results = { blocks: [], transactions: [], addresses: [] };

  // Search blocks
  const block = blockchain.getBlockByHash(q) || (/^\d+$/.test(q) ? blockchain.getBlockByIndex(parseInt(q)) : null);
  if (block) results.blocks.push({ index: block.index, hash: block.hash, timestamp: block.timestamp, txCount: block.transactions.length });

  // Search transactions
  const tx = blockchain.getTransactionById(q);
  if (tx) results.transactions.push(tx);

  // Search address
  const balance = blockchain.getBalanceOfAddress(q);
  if (balance !== 0 || q.startsWith('BC1')) {
    results.addresses.push({ address: q, balance, txCount: blockchain.getAllTransactionsForAddress(q).length });
  }

  res.json({ success: true, data: results, query: q });
};

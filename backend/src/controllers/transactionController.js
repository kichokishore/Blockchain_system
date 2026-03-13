const { blockchain, Transaction } = require('../blockchain/Blockchain');
const { walletManager } = require('../blockchain/WalletManager');
const CryptoJS = require('crypto-js');

exports.createTransaction = async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, fee = 0.001, password, memo } = req.body;

    if (!fromAddress || !toAddress || !amount || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const wallet = walletManager.getWallet(fromAddress);
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    if (wallet.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your wallet' });
    }

    // Verify password and create signature
    let signature;
    try {
      const txHash = CryptoJS.SHA256(fromAddress + toAddress + amount + fee + Date.now()).toString();
      signature = walletManager.signTransaction(fromAddress, password, txHash);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid wallet password' });
    }

    const tx = new Transaction(fromAddress, toAddress, parseFloat(amount), parseFloat(fee), memo ? { memo } : null, 'TRANSFER');
    tx.signature = signature;

    const confirmed = blockchain.addTransaction(tx);

    res.status(201).json({
      success: true,
      message: 'Transaction submitted successfully',
      data: confirmed
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTransactionsForAddress = (req, res) => {
  const { address } = req.params;
  const { page = 1, limit = 20, type, status } = req.query;
  let txs = blockchain.getAllTransactionsForAddress(address);

  if (type) txs = txs.filter(tx => tx.type === type);
  if (status) txs = txs.filter(tx => tx.status === status);

  const total = txs.length;
  const start = (page - 1) * limit;
  const paginated = txs.slice(start, start + parseInt(limit));

  res.json({ success: true, data: { transactions: paginated, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

exports.getTransactionById = (req, res) => {
  const tx = blockchain.getTransactionById(req.params.txId);
  if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
  res.json({ success: true, data: tx });
};

exports.getPendingTransactions = (req, res) => {
  const pending = blockchain.pendingTransactions.map(tx => tx.toJSON ? tx.toJSON() : tx);
  res.json({ success: true, data: pending });
};

exports.minePendingTransactions = (req, res) => {
  try {
    const { minerAddress } = req.body;
    if (!minerAddress) return res.status(400).json({ success: false, message: 'Miner address required' });

    if (blockchain.pendingTransactions.length === 0) {
      return res.status(400).json({ success: false, message: 'No pending transactions to mine' });
    }

    const result = blockchain.minePendingTransactions(minerAddress);
    res.json({
      success: true,
      message: 'Block mined successfully',
      data: {
        blockIndex: result.block.index,
        blockHash: result.block.hash,
        transactionCount: result.block.transactions.length,
        nonce: result.nonce,
        mineTime: result.mineTime,
        reward: blockchain.miningReward + result.fees
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAuditLog = (req, res) => {
  const { startDate, endDate, type, address, page = 1, limit = 50 } = req.query;

  let allTxs = [];
  for (const block of blockchain.chain) {
    for (const tx of block.transactions) {
      allTxs.push({ ...tx, blockIndex: block.index, blockHash: block.hash, confirmations: blockchain.chain.length - block.index });
    }
  }

  if (startDate) allTxs = allTxs.filter(tx => tx.timestamp >= new Date(startDate).getTime());
  if (endDate) allTxs = allTxs.filter(tx => tx.timestamp <= new Date(endDate).getTime());
  if (type) allTxs = allTxs.filter(tx => tx.type === type);
  if (address) allTxs = allTxs.filter(tx => tx.fromAddress === address || tx.toAddress === address);

  allTxs.sort((a, b) => b.timestamp - a.timestamp);

  const total = allTxs.length;
  const start = (page - 1) * limit;
  const paginated = allTxs.slice(start, start + parseInt(limit));

  const summary = {
    totalTransactions: total,
    totalVolume: allTxs.reduce((s, tx) => s + (tx.amount || 0), 0).toFixed(8),
    totalFees: allTxs.reduce((s, tx) => s + (tx.fee || 0), 0).toFixed(8),
    byType: allTxs.reduce((acc, tx) => { acc[tx.type] = (acc[tx.type] || 0) + 1; return acc; }, {})
  };

  res.json({ success: true, data: { transactions: paginated, total, summary, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

exports.getAnalytics = (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const now = Date.now();
  const since = now - days * 24 * 60 * 60 * 1000;

  const dailyData = {};
  let totalVolume = 0, totalTxCount = 0;

  for (const block of blockchain.chain) {
    for (const tx of block.transactions) {
      if (tx.timestamp >= since) {
        const day = new Date(tx.timestamp).toISOString().split('T')[0];
        if (!dailyData[day]) dailyData[day] = { volume: 0, count: 0, fees: 0 };
        dailyData[day].volume += tx.amount || 0;
        dailyData[day].count++;
        dailyData[day].fees += tx.fee || 0;
        totalVolume += tx.amount || 0;
        totalTxCount++;
      }
    }
  }

  const chartData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  res.json({
    success: true,
    data: {
      chartData,
      summary: {
        totalVolume: parseFloat(totalVolume.toFixed(8)),
        totalTransactions: totalTxCount,
        avgTxPerDay: (totalTxCount / days).toFixed(2),
        networkStats: blockchain.getNetworkStats()
      }
    }
  });
};

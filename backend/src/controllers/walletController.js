const { walletManager } = require('../blockchain/WalletManager');
const { blockchain } = require('../blockchain/Blockchain');

exports.createWallet = (req, res) => {
  try {
    const { walletName, password } = req.body;
    if (!walletName || !password) {
      return res.status(400).json({ success: false, message: 'Wallet name and password required' });
    }
    const wallet = walletManager.createWallet(req.user.id, walletName, password);
    res.status(201).json({
      success: true,
      message: 'Wallet created. SAVE YOUR MNEMONIC PHRASE - it will not be shown again!',
      data: wallet
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.importWallet = (req, res) => {
  try {
    const { mnemonic, password, walletName } = req.body;
    if (!mnemonic || !password) {
      return res.status(400).json({ success: false, message: 'Mnemonic and password required' });
    }
    const wallet = walletManager.importWallet(req.user.id, mnemonic, password, walletName);
    res.json({ success: true, message: 'Wallet imported successfully', data: { address: wallet.address, name: wallet.name } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getWallets = (req, res) => {
  const wallets = walletManager.getWalletsForUser(req.user.id);
  const walletsWithBalance = wallets.map(w => ({
    ...w,
    balance: blockchain.getBalanceOfAddress(w.address),
    pendingCount: blockchain.pendingTransactions.filter(tx => tx.fromAddress === w.address || tx.toAddress === w.address).length
  }));
  res.json({ success: true, data: walletsWithBalance });
};

exports.getWalletDetails = (req, res) => {
  const { address } = req.params;
  const wallet = walletManager.getWallet(address);
  if (!wallet || wallet.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Wallet not found' });
  }
  const balance = blockchain.getBalanceOfAddress(address);
  const txHistory = blockchain.getAllTransactionsForAddress(address);
  const pending = txHistory.filter(tx => tx.status === 'PENDING');
  const confirmed = txHistory.filter(tx => tx.status === 'CONFIRMED');

  res.json({
    success: true,
    data: {
      address: wallet.address,
      name: wallet.name,
      type: wallet.type,
      createdAt: wallet.createdAt,
      balance,
      stats: {
        totalTransactions: txHistory.length,
        pendingCount: pending.length,
        confirmedCount: confirmed.length,
        totalSent: confirmed.filter(tx => tx.fromAddress === address).reduce((s, tx) => s + tx.amount, 0),
        totalReceived: confirmed.filter(tx => tx.toAddress === address).reduce((s, tx) => s + tx.amount, 0)
      }
    }
  });
};

exports.exportWallet = (req, res) => {
  try {
    const { address } = req.params;
    const { password } = req.body;
    const wallet = walletManager.getWallet(address);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    const exported = walletManager.exportWallet(address, password);
    res.json({ success: true, data: exported });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

exports.renameWallet = (req, res) => {
  try {
    const { address } = req.params;
    const { name } = req.body;
    const wallet = walletManager.renameWallet(address, req.user.id, name);
    res.json({ success: true, data: { address: wallet.address, name: wallet.name } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

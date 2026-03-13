const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const authController = require('../controllers/authController');
const transactionController = require('../controllers/transactionController');
const walletController = require('../controllers/walletController');
const contractController = require('../controllers/contractController');
const explorerController = require('../controllers/explorerController');

// ─── Auth Routes ───────────────────────────────────────────────────────────────
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.get('/auth/users', authenticate, authorize('ADMIN'), authController.getUsers);

// ─── Wallet Routes ─────────────────────────────────────────────────────────────
router.post('/wallets', authenticate, walletController.createWallet);
router.get('/wallets', authenticate, walletController.getWallets);
router.post('/wallets/import', authenticate, walletController.importWallet);
router.get('/wallets/:address', authenticate, walletController.getWalletDetails);
router.post('/wallets/:address/export', authenticate, walletController.exportWallet);
router.put('/wallets/:address/rename', authenticate, walletController.renameWallet);

// ─── Transaction Routes ────────────────────────────────────────────────────────
router.post('/transactions', authenticate, transactionController.createTransaction);
router.get('/transactions/pending', authenticate, transactionController.getPendingTransactions);
router.post('/transactions/mine', authenticate, transactionController.minePendingTransactions);
router.get('/transactions/audit', authenticate, authorize('ADMIN', 'AUDITOR'), transactionController.getAuditLog);
router.get('/transactions/analytics', authenticate, transactionController.getAnalytics);
router.get('/transactions/:txId', authenticate, transactionController.getTransactionById);
router.get('/addresses/:address/transactions', authenticate, transactionController.getTransactionsForAddress);

// ─── Smart Contract Routes ─────────────────────────────────────────────────────
router.post('/contracts', authenticate, contractController.deployContract);
router.get('/contracts', authenticate, contractController.getAllContracts);
router.get('/contracts/:contractId', authenticate, contractController.getContract);
router.post('/contracts/:contractId/call', authenticate, contractController.callContract);
router.get('/contracts/:contractId/transactions', authenticate, contractController.getContractTransactions);

// ─── Block Explorer Routes ─────────────────────────────────────────────────────
router.get('/explorer/chain', explorerController.getChain);
router.get('/explorer/stats', explorerController.getNetworkStats);
router.get('/explorer/validate', authenticate, authorize('ADMIN', 'AUDITOR'), explorerController.validateChain);
router.get('/explorer/search', explorerController.search);
router.get('/explorer/blocks/:identifier', explorerController.getBlock);

module.exports = router;

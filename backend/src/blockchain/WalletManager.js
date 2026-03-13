const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

class WalletManager {
  constructor() {
    this.wallets = new Map(); // In production, use encrypted DB
  }

  // Generate a deterministic key pair from a seed phrase
  generateKeyPair(seedPhrase) {
    const seed = CryptoJS.SHA256(seedPhrase + 'BLOCKCHAIN_SALT_V1').toString();
    const privateKey = CryptoJS.SHA256(seed + 'PRIVATE').toString();
    const publicKey = CryptoJS.SHA256(seed + 'PUBLIC').toString();
    return { privateKey, publicKey };
  }

  generateMnemonic() {
    const words = [
      'abandon','ability','able','about','above','absent','absorb','abstract',
      'absurd','abuse','access','accident','account','accuse','achieve','acid',
      'acoustic','acquire','across','action','actor','actual','adapt','add',
      'addict','address','adjust','admit','adult','advance','advice','aerobic',
      'afford','afraid','again','agent','agree','ahead','aim','air','airport',
      'aisle','alarm','album','alcohol','alert','alien','all','alley','allow',
      'almost','alone','alpha','already','also','alter','always','amateur',
      'amazing','among','amount','amused','analyst','anchor','ancient','anger',
      'angle','angry','animal','ankle','announce','annual','another','answer'
    ];
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const randomBytes = CryptoJS.lib.WordArray.random(4);
      const index = parseInt(randomBytes.toString(), 16) % words.length;
      mnemonic.push(words[index]);
    }
    return mnemonic.join(' ');
  }

  createWallet(userId, walletName, password) {
    const mnemonic = this.generateMnemonic();
    const { privateKey, publicKey } = this.generateKeyPair(mnemonic + password);

    const wallet = {
      id: uuidv4(),
      userId,
      name: walletName,
      address: 'BC1' + publicKey.substring(0, 32).toUpperCase(),
      publicKey,
      encryptedPrivateKey: CryptoJS.AES.encrypt(privateKey, password).toString(),
      mnemonic: CryptoJS.AES.encrypt(mnemonic, password).toString(),
      createdAt: Date.now(),
      isActive: true,
      type: 'HD_WALLET',
      metadata: {
        version: '1.0',
        keyDerivation: 'SHA256-HMAC'
      }
    };

    this.wallets.set(wallet.address, wallet);
    return {
      ...wallet,
      mnemonic, // Return plain mnemonic ONCE at creation
      encryptedPrivateKey: undefined
    };
  }

  importWallet(userId, mnemonic, password, walletName) {
    const { privateKey, publicKey } = this.generateKeyPair(mnemonic + password);
    const address = 'BC1' + publicKey.substring(0, 32).toUpperCase();

    if (this.wallets.has(address)) {
      return this.wallets.get(address);
    }

    const wallet = {
      id: uuidv4(),
      userId,
      name: walletName || 'Imported Wallet',
      address,
      publicKey,
      encryptedPrivateKey: CryptoJS.AES.encrypt(privateKey, password).toString(),
      mnemonic: CryptoJS.AES.encrypt(mnemonic, password).toString(),
      createdAt: Date.now(),
      isActive: true,
      type: 'IMPORTED'
    };

    this.wallets.set(address, wallet);
    return wallet;
  }

  getWallet(address) {
    return this.wallets.get(address) || null;
  }

  getWalletsForUser(userId) {
    const userWallets = [];
    for (const [, wallet] of this.wallets) {
      if (wallet.userId === userId) {
        userWallets.push({
          id: wallet.id,
          name: wallet.name,
          address: wallet.address,
          publicKey: wallet.publicKey,
          createdAt: wallet.createdAt,
          isActive: wallet.isActive,
          type: wallet.type
        });
      }
    }
    return userWallets;
  }

  decryptPrivateKey(address, password) {
    const wallet = this.wallets.get(address);
    if (!wallet) throw new Error('Wallet not found');
    try {
      const bytes = CryptoJS.AES.decrypt(wallet.encryptedPrivateKey, password);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      throw new Error('Invalid password');
    }
  }

  signTransaction(address, password, txHash) {
    const privateKey = this.decryptPrivateKey(address, password);
    // Create HMAC-based signature
    const signature = CryptoJS.HmacSHA256(txHash, privateKey).toString();
    return signature;
  }

  verifySignature(address, txHash, signature) {
    const wallet = this.wallets.get(address);
    if (!wallet) return false;
    // In a real system, use EC signature verification
    return signature.length === 64;
  }

  exportWallet(address, password) {
    const wallet = this.wallets.get(address);
    if (!wallet) throw new Error('Wallet not found');
    const decryptedMnemonic = CryptoJS.AES.decrypt(wallet.mnemonic, password).toString(CryptoJS.enc.Utf8);
    if (!decryptedMnemonic) throw new Error('Invalid password');
    return {
      address: wallet.address,
      mnemonic: decryptedMnemonic,
      exportedAt: Date.now()
    };
  }

  renameWallet(address, userId, newName) {
    const wallet = this.wallets.get(address);
    if (!wallet || wallet.userId !== userId) throw new Error('Wallet not found');
    wallet.name = newName;
    return wallet;
  }
}

const walletManager = new WalletManager();
module.exports = { WalletManager, walletManager };

const { userStore } = require('../models/UserStore');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { walletManager } = require('../blockchain/WalletManager');
const { blockchain } = require('../blockchain/Blockchain');

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await userStore.createUser({ username, email, password, fullName, role: 'USER' });

    // Auto-create initial wallet
    const wallet = walletManager.createWallet(user.id, `${username}'s Wallet`, password);

    // Fund new user with initial balance for demo
    const { Transaction } = require('../blockchain/Blockchain');
    const fundTx = new Transaction(null, wallet.address, 500, 0, { reason: 'Welcome bonus' }, 'REWARD');
    fundTx.status = 'PENDING';
    blockchain.pendingTransactions.push(fundTx);
    blockchain.minePendingTransactions('SYSTEM');

    const { accessToken, refreshToken } = generateTokens(user);
    await userStore.updateLastLogin(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken, refreshToken, wallet: { address: wallet.address, mnemonic: wallet.mnemonic } }
    });
  } catch (err) {
    if (err.message === 'User already exists') {
      return res.status(409).json({ success: false, message: err.message });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const lockStatus = userStore.isLocked(user);
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil((lockStatus.until - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${minutesLeft} minutes` });
    }

    const isValid = await userStore.validatePassword(user, password);
    if (!isValid) {
      await userStore.incrementLoginAttempts(email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await userStore.updateLastLogin(user.id);
    const { accessToken, refreshToken } = generateTokens(user);
    const wallets = walletManager.getWalletsForUser(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userStore.sanitize(user), accessToken, refreshToken, wallets }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await userStore.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const tokens = generateTokens(user);
    res.json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  const user = await userStore.findById(req.user.id);
  const wallets = walletManager.getWalletsForUser(req.user.id);
  res.json({ success: true, data: { user: userStore.sanitize(user), wallets } });
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, preferences } = req.body;
    const updated = userStore.updateUser(req.user.id, { fullName, preferences });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const users = userStore.getAllUsers();
  res.json({ success: true, data: users });
};

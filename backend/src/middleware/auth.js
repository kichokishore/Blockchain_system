const jwt = require('jsonwebtoken');
const { userStore } = require('../models/UserStore');

const JWT_SECRET = process.env.JWT_SECRET || 'blockchain_super_secret_key_2024_production';
const JWT_EXPIRES = '24h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'blockchain_refresh_secret_2024';

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, username: user.username };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await userStore.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = userStore.sanitize(user);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, authorize, generateTokens, verifyToken, verifyRefreshToken };

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserStore {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this._seedAdminUser();
  }

  async _seedAdminUser() {
    await this.createUser({
      username: 'admin',
      email: 'admin@blockchain.sys',
      password: 'Admin@123456',
      role: 'ADMIN',
      fullName: 'System Administrator'
    });
    await this.createUser({
      username: 'alice',
      email: 'alice@blockchain.sys',
      password: 'Alice@123456',
      role: 'USER',
      fullName: 'Alice Johnson'
    });
    await this.createUser({
      username: 'bob',
      email: 'bob@blockchain.sys',
      password: 'Bob@123456',
      role: 'USER',
      fullName: 'Bob Williams'
    });
    await this.createUser({
      username: 'auditor',
      email: 'auditor@blockchain.sys',
      password: 'Auditor@123456',
      role: 'AUDITOR',
      fullName: 'Audit Department'
    });
  }

  async createUser({ username, email, password, role = 'USER', fullName }) {
    const existing = [...this.users.values()].find(
      u => u.email === email || u.username === username
    );
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      role,
      fullName,
      createdAt: Date.now(),
      lastLogin: null,
      isActive: true,
      twoFactorEnabled: false,
      loginAttempts: 0,
      lockedUntil: null,
      preferences: {
        currency: 'USD',
        theme: 'dark',
        notifications: true
      }
    };

    this.users.set(user.id, user);
    return this.sanitize(user);
  }

  async findByEmail(email) {
    return [...this.users.values()].find(u => u.email === email) || null;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  async updateLastLogin(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = Date.now();
      user.loginAttempts = 0;
    }
  }

  async incrementLoginAttempts(email) {
    const user = [...this.users.values()].find(u => u.email === email);
    if (user) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }
    }
  }

  isLocked(user) {
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      return { locked: true, until: user.lockedUntil };
    }
    return { locked: false };
  }

  sanitize(user) {
    const { password, ...safe } = user;
    return safe;
  }

  getAllUsers() {
    return [...this.users.values()].map(u => this.sanitize(u));
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    return this.sanitize(user);
  }
}

const userStore = new UserStore();
module.exports = { UserStore, userStore };

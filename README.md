# ⛓️ ChainVault — Blockchain-Based Secure Financial Transaction Management System

A **production-grade** full-stack blockchain application built with React + Node.js/Express.

---

## 🏗️ Architecture

```
blockchain-system/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── blockchain/
│       │   ├── Blockchain.js   # Core blockchain engine (PoW, Merkle Tree, Smart Contracts)
│       │   └── WalletManager.js # Cryptographic wallet management
│       ├── controllers/        # Route handlers
│       ├── middleware/         # JWT auth, rate limiting
│       ├── models/             # In-memory data stores
│       ├── routes/             # API route definitions
│       └── server.js           # Express app entry
│
└── frontend/                   # React 18 SPA
    └── src/
        ├── contexts/           # Auth context
        ├── components/         # Reusable UI components
        ├── pages/              # Full page views
        └── utils/api.js        # Axios API layer
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### 1. Install Dependencies
```bash
# From project root
npm install            # installs concurrently
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start Backend
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

### 3. Start Frontend (new terminal)
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

---

## 👤 Demo Accounts

| Role    | Email                    | Password        |
|---------|--------------------------|-----------------|
| Admin   | admin@blockchain.sys     | Admin@123456    |
| User    | alice@blockchain.sys     | Alice@123456    |
| User    | bob@blockchain.sys       | Bob@123456      |
| Auditor | auditor@blockchain.sys   | Auditor@123456  |

Each user wallet is pre-funded with **1000 demo tokens**.

---

## 🔑 Core Features

### Blockchain Engine
- ✅ SHA-256 Proof of Work mining (difficulty 3)
- ✅ Merkle Tree for transaction verification
- ✅ Chain integrity validation
- ✅ Genesis block creation
- ✅ Block explorer with full chain data

### Wallet System
- ✅ HD wallet generation with 12-word BIP-39 mnemonic
- ✅ AES-256 encrypted private key storage
- ✅ HMAC-SHA256 transaction signing
- ✅ Multi-wallet per user
- ✅ Wallet import/export

### Transactions
- ✅ Cryptographically signed transfers
- ✅ Balance validation before submission
- ✅ Network fee support
- ✅ Transaction memos
- ✅ Pending → Confirmed lifecycle
- ✅ Full transaction history with pagination

### Smart Contracts (Simulated)
- ✅ Deploy Solidity-style contracts
- ✅ Automatic ABI extraction from function signatures
- ✅ Method calling with parameter parsing
- ✅ Persistent state storage
- ✅ Built-in methods: transfer, getBalance, store, retrieve, addFunds

### Security
- ✅ JWT access tokens (24h) + refresh tokens (7d)
- ✅ bcrypt password hashing (12 rounds)
- ✅ Rate limiting (100 req/15min, 20 auth/15min)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Account lockout after 5 failed attempts (15min)
- ✅ Role-based access control (ADMIN, USER, AUDITOR)

### Audit & Analytics
- ✅ Full immutable audit log with CSV export
- ✅ Real-time charts (volume, count, fees)
- ✅ Transaction type distribution (pie chart)
- ✅ Network statistics dashboard
- ✅ Date range filtering

---

## 📡 API Reference

### Auth
```
POST   /api/auth/register       Create account
POST   /api/auth/login          Login
POST   /api/auth/refresh        Refresh token
GET    /api/auth/profile        Get profile
```

### Wallets
```
GET    /api/wallets             List user wallets
POST   /api/wallets             Create wallet
POST   /api/wallets/import      Import from mnemonic
GET    /api/wallets/:address    Wallet details + stats
POST   /api/wallets/:addr/export  Export mnemonic
```

### Transactions
```
POST   /api/transactions              Submit transaction
GET    /api/transactions/pending      Pending pool
POST   /api/transactions/mine         Mine a block
GET    /api/transactions/:txId        Get by ID
GET    /api/addresses/:addr/transactions  History
GET    /api/transactions/audit        Audit log (Admin/Auditor)
GET    /api/transactions/analytics    Analytics data
```

### Smart Contracts
```
POST   /api/contracts                 Deploy contract
GET    /api/contracts                 List all
GET    /api/contracts/:id             Contract details
POST   /api/contracts/:id/call        Call method
```

### Explorer
```
GET    /api/explorer/chain            Full blockchain
GET    /api/explorer/blocks/:id       Block by index/hash
GET    /api/explorer/stats            Network statistics
GET    /api/explorer/validate         Validate chain integrity
GET    /api/explorer/search?q=...     Search
```

---

## 🔐 Security Notes for Production

1. **Change JWT secrets** in `.env` to strong random strings
2. **Use MongoDB/PostgreSQL** instead of in-memory stores
3. **Add HTTPS** with SSL certificates
4. **Deploy behind nginx** reverse proxy
5. **Enable real HSM** for key management
6. **Add 2FA** for user accounts
7. Set `NODE_ENV=production` for error masking

---

## 🛠️ Technology Stack

| Layer      | Technology               |
|------------|--------------------------|
| Frontend   | React 18, React Router 6 |
| Charts     | Recharts                 |
| Styling    | Custom CSS (design system)|
| HTTP       | Axios                    |
| Backend    | Node.js, Express 4       |
| Auth       | JWT, bcryptjs            |
| Crypto     | crypto-js, SHA-256       |
| Security   | Helmet, express-rate-limit|
| Fonts      | Syne, JetBrains Mono     |

---

## 📁 Key Files

| File                                    | Purpose                            |
|-----------------------------------------|------------------------------------|
| `backend/src/blockchain/Blockchain.js`  | Core blockchain + smart contracts  |
| `backend/src/blockchain/WalletManager.js` | Cryptographic wallet operations  |
| `backend/src/middleware/auth.js`        | JWT authentication middleware      |
| `frontend/src/utils/api.js`             | Complete API service layer         |
| `frontend/src/index.css`                | Full design system CSS             |

---

*Built for production deployment. Replace in-memory storage with a real database for persistent data.*

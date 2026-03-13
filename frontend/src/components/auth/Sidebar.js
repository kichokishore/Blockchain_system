import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, FileCode, Search,
  FileText, BarChart2, Settings, LogOut, Shield, Users
} from 'lucide-react';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/wallets', icon: Wallet, label: 'Wallets' },
      { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
      { to: '/contracts', icon: FileCode, label: 'Smart Contracts' },
    ]
  },
  {
    label: 'Network',
    items: [
      { to: '/explorer', icon: Search, label: 'Block Explorer' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    ]
  },
  {
    label: 'Admin',
    roles: ['ADMIN', 'AUDITOR'],
    items: [
      { to: '/audit', icon: FileText, label: 'Audit Log', roles: ['ADMIN', 'AUDITOR'] },
      { to: '/users', icon: Users, label: 'Users', roles: ['ADMIN'] },
    ]
  }
];

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⛓️</div>
        <div>
          <div className="logo-text">ChainVault</div>
          <div className="logo-sub">BLOCKCHAIN SYSTEM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map(section => {
          if (section.roles && !section.roles.includes(user?.role)) return null;
          const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(user?.role));
          if (!visibleItems.length) return null;

          return (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} className="nav-icon" />
                  {item.label}
                  {item.label === 'Transactions' && pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
        <div className="user-card" onClick={() => navigate('/profile')}>
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.fullName || 'User'}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

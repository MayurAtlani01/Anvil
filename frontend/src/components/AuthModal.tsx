import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accentColor?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accentColor = '#FF6845',
}) => {
  const { user, isAuthenticated, login, register, logout, isLoading, error, clearError } = useAuthStore();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showSwitchForm, setShowSwitchForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    setShowSwitchForm(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);

    if (tab === 'signup') {
      if (!fullName.trim() || !email.trim() || !password.trim()) return;
      const ok = await register(fullName, email, password);
      if (ok) {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    } else {
      if (!email.trim() || !password.trim()) return;
      const ok = await login(email, password);
      if (ok) {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--anvil-card-bg, #151515)',
          border: '1px solid var(--anvil-border, #2A2A2A)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.1)',
          color: 'var(--anvil-text, #F5F5F5)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--anvil-text-subtle, #737373)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* If authenticated and not switching accounts, show profile card */}
        {isAuthenticated && user && !showSwitchForm ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${accentColor}20`,
                  border: `1.5px solid ${accentColor}60`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentColor,
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {(user.full_name || user.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--anvil-text, #F5F5F5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || 'Anvil Scholar'}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--anvil-text-muted, #A7A7A7)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'var(--anvil-card-bg-subtle, #1A1A1A)',
                border: '1px solid var(--anvil-border-subtle, #262626)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888' }}>Account Status</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#34D399', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399' }} />
                  Active Profile
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888' }}>Sync Target</span>
                <span style={{ color: 'var(--anvil-text, #F5F5F5)', fontWeight: 500 }}>Personal Flashcards & Notes</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid var(--anvil-border, #333)',
                  color: 'var(--anvil-text, #F5F5F5)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Switch Account
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: '#EF444415',
                  border: '1px solid #EF444440',
                  color: '#EF4444',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Emblem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentColor,
                }}
              >
                <Sparkles style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--anvil-text, #F5F5F5)' }}>
                  Anvil Account
                </h2>
                <p style={{ fontSize: 11, color: 'var(--anvil-text-muted, #A7A7A7)', margin: 0 }}>
                  Save flashcards, notes & progress across pages
                </p>
              </div>
            </div>

            {/* Tab Switcher: Sign In vs Create Account */}
            <div
              style={{
                display: 'flex',
                background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                border: '1px solid var(--anvil-border-subtle, #242424)',
                borderRadius: 10,
                padding: 3,
                margin: '16px 0 18px 0',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  clearError();
                }}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 7,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === 'signin' ? accentColor : 'transparent',
              color: tab === 'signin' ? '#FFFFFF' : 'var(--anvil-text-muted, #A7A7A7)',
              transition: 'all 120ms ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              clearError();
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: 7,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === 'signup' ? accentColor : 'transparent',
              color: tab === 'signup' ? '#FFFFFF' : 'var(--anvil-text-muted, #A7A7A7)',
              transition: 'all 120ms ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255, 107, 107, 0.12)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              color: '#FF6B6B',
              fontSize: 11.5,
              marginBottom: 14,
            }}
          >
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(53, 214, 162, 0.12)',
              border: '1px solid rgba(53, 214, 162, 0.3)',
              color: '#35D6A2',
              fontSize: 11.5,
              marginBottom: 14,
            }}
          >
            <Check style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--anvil-text-muted, #A7A7A7)', marginBottom: 4 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--anvil-text-subtle, #737373)' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mayur Atlani"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 8,
                    background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                    border: '1px solid var(--anvil-border, #2A2A2A)',
                    color: 'var(--anvil-text, #F5F5F5)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--anvil-text-muted, #A7A7A7)', marginBottom: 4 }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--anvil-text-subtle, #737373)' }} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. scholar123 or user@study.com"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 8,
                  background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                  border: '1px solid var(--anvil-border, #2A2A2A)',
                  color: 'var(--anvil-text, #F5F5F5)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--anvil-text-muted, #A7A7A7)', marginBottom: 4 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--anvil-text-subtle, #737373)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 8,
                  background: 'var(--anvil-card-bg-subtle, #1D1D1D)',
                  border: '1px solid var(--anvil-border, #2A2A2A)',
                  color: 'var(--anvil-text, #F5F5F5)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--anvil-text-subtle, #737373)', lineHeight: 1.35, marginTop: 2 }}>
            Instant account creation • No email verification required
          </div>

          <button
            type="submit"
            disabled={isLoading || Boolean(successMsg)}
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 9,
              background: accentColor,
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: 'none',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} />
                <span>Processing...</span>
              </>
            ) : tab === 'signup' ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Scale, ShieldCheck, UserRound } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Vikramaditya Sharma',
    title: 'Administrator',
    email: 'admin@legalchambers.com',
    password: 'admin123',
    icon: ShieldCheck,
    role: 'admin',
  },
  {
    name: 'Ravi Verma',
    title: 'Senior Associate',
    email: 'ravi@legalchambers.com',
    password: 'ravi123',
    icon: UserRound,
    role: 'member',
  },
  {
    name: 'Priya Nair',
    title: 'Chamber Intern',
    email: 'priya@legalchambers.com',
    password: 'priya123',
    icon: UserRound,
    role: 'member',
  },
];

export default function LoginView({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    await onLogin(loginEmail, loginPassword);
    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password || loading) return;
    await submitLogin(email, password);
  };

  const handleDemoLogin = async (account) => {
    if (loading) return;
    setEmail(account.email);
    setPassword(account.password);
    await submitLogin(account.email, account.password);
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <header className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <Scale size={21} strokeWidth={1.8} />
          </div>
          <div>
            <div className="login-brand-name">Chambers Availability Board</div>
            <div className="login-brand-location">Bombay High Court &amp; Maharashtra courts</div>
          </div>
        </header>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-heading">
            <span className="login-overline">MEMBER ACCESS</span>
            <h1 id="login-title">Sign in</h1>
            <p>View today’s court availability and share updates with your team.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@chambers.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Sign in to board'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <div className="demo-accounts">
            <div className="demo-accounts-heading">
              <span>Demo accounts</span>
              <span>Choose a role to continue</span>
            </div>
            <div className="demo-account-list">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    className="demo-account-button"
                    type="button"
                    key={account.email}
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading}
                  >
                    <span className={`demo-account-icon ${account.role}`}>
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span className="demo-account-copy">
                      <strong>{account.name}</strong>
                      <span>{account.title}</span>
                    </span>
                    <ArrowRight className="demo-account-arrow" size={16} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <p className="login-footnote">For authorized chamber members and staff</p>
      </div>
    </main>
  );
}

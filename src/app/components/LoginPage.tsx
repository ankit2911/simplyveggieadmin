'use client';

import React, { useState } from 'react';
import { Carrot, Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(-45deg, #108542, #2ecc71, #27ae60, #1abc9c);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          position: relative;
          overflow: hidden;
        }
        .floating-icon {
          position: absolute;
          color: white;
          opacity: 0.15;
          animation: float 6s ease-in-out infinite;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          position: relative;
          z-index: 10;
        }
        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo-icon-container {
          display: inline-flex;
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          border-radius: 20px;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
          box-shadow: 0 12px 24px rgba(243, 156, 18, 0.35);
          transform: rotate(5deg);
          transition: transform 0.3s;
        }
        .logo-icon-container:hover {
          transform: rotate(0deg);
        }
        .logo-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .logo-simply {
          font-size: 24px;
          font-weight: 800;
          color: #333;
        }
        .logo-veggie {
          font-size: 24px;
          font-weight: 800;
          color: #108542;
        }
        .logo-tagline {
          font-size: 13px;
          color: #888;
          font-style: italic;
          margin-top: 4px;
        }
        .company-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 16px;
          background: linear-gradient(90deg, #e8f5e9, #fff3e0);
          border-radius: 20px;
          font-size: 9px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        .form-input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: #2ecc71;
          box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
        }
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
        }
        .password-toggle:hover {
          color: #666;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #108542, #2ecc71);
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 8px 20px rgba(16, 133, 66, 0.3);
          position: relative;
        }
        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 12px 28px rgba(16, 133, 66, 0.4);
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .submit-btn .spinner {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .demo-section {
          margin-top: 24px;
          padding: 16px;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .demo-title {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        .demo-creds {
          font-size: 12px;
          color: #666;
        }
      `}</style>

      <div className="login-page">
        {/* Floating decorative icons */}
        <Carrot className="floating-icon" style={{ top: '10%', left: '8%', width: 80, height: 80, animationDelay: '0s' }} />
        <Leaf className="floating-icon" style={{ top: '20%', right: '10%', width: 100, height: 100, animationDelay: '2s' }} />
        <Carrot className="floating-icon" style={{ bottom: '15%', left: '15%', width: 120, height: 120, animationDelay: '1s', transform: 'rotate(-45deg)' }} />
        <Leaf className="floating-icon" style={{ bottom: '20%', right: '8%', width: 60, height: 60, animationDelay: '3s' }} />

        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon-container">
              <Carrot size={40} />
            </div>
            <div className="logo-title">
              <span className="logo-simply">Simply</span>
              <span className="logo-veggie">Veggie</span>
            </div>
            <div className="logo-tagline">your kitchen partner</div>
            <div className="company-badge">Future Veggies India Private Limited</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? <div className="spinner" /> : 'Sign In →'}
            </button>
          </form>

          <div className="demo-section">
            <div className="demo-title">Demo Credentials</div>
            <div className="demo-creds">admin@example.com • 12345678</div>
          </div>
        </div>
      </div>
    </>
  );
}

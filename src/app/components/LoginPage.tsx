import React, { useState } from 'react';
import { Carrot } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-orange-100 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Carrot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center uppercase font-serif italic">Simply Veggie</h1>
          <p className="text-sm italic text-gray-500 mt-1 font-serif">your kitchen partner</p>
          <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
            FUTURE VEGGIES INDIA PRIVATE LIMITED
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign In
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Demo Credentials:<br />
              Email: admin@example.com<br />
              Password: 12345678
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

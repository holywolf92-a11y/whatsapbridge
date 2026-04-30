import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Users, Shield, UserCheck, LogIn } from 'lucide-react';
import { useAuth } from '../lib/authContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  // Demo accounts for easy login
  const demoAccounts = [
    { role: 'Admin', email: 'admin@falisha.com', password: 'admin123', color: 'from-purple-500 to-purple-600' },
    { role: 'Manager', email: 'maria@falisha.com', password: 'manager123', color: 'from-blue-500 to-blue-600' },
    { role: 'Recruiter', email: 'john@falisha.com', password: 'recruiter123', color: 'from-green-500 to-green-600' },
    { role: 'Viewer', email: 'david@falisha.com', password: 'viewer123', color: 'from-gray-500 to-gray-600' },
  ];

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Falisha Manpower</h1>
            <p className="text-gray-600">AI-Powered Recruitment Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Login Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>

        {/* Right Side - Demo Accounts */}
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
            <h2 className="text-2xl mb-4">Welcome Back!</h2>
            <p className="text-blue-100 mb-6">
              Access your recruitment dashboard to manage candidates, track applications, and streamline your hiring process with AI-powered insights.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl mb-1">150+</div>
                <div className="text-xs text-blue-100">Candidates</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl mb-1">98%</div>
                <div className="text-xs text-blue-100">Success Rate</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <UserCheck className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl mb-1">45</div>
                <div className="text-xs text-blue-100">Deployed</div>
              </div>
            </div>
          </div>

          {/* Demo Accounts Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl mb-2 text-gray-900">Demo Accounts</h3>
            <p className="text-sm text-gray-600 mb-6">
              Click any account below to quick login and explore different role permissions
            </p>
            <div className="space-y-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account.email, account.password)}
                  className="w-full group"
                >
                  <div className={`bg-gradient-to-r ${account.color} rounded-lg p-4 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          {account.role === 'Admin' && <Shield className="w-5 h-5" />}
                          {account.role === 'Manager' && <UserCheck className="w-5 h-5" />}
                          {account.role === 'Recruiter' && <Users className="w-5 h-5" />}
                          {account.role === 'Viewer' && <Eye className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{account.role}</div>
                          <div className="text-xs text-white text-opacity-90">{account.email}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Login →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Permissions Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Role Permissions:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><strong>Admin:</strong> Full access to all features and settings</li>
                <li><strong>Manager:</strong> Manage candidates, view analytics, no user management</li>
                <li><strong>Recruiter:</strong> Add/edit candidates, upload documents, basic analytics</li>
                <li><strong>Viewer:</strong> Read-only access to candidates and jobs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

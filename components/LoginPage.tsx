import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, Zap, Sparkles, Shield, TrendingUp, Users, Rocket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Animated background particles
const FloatingParticle: React.FC<{ delay: number; duration: number; size: number; left: string; top: string }> = ({
  delay, duration, size, left, top
}) => (
  <div
    className="absolute rounded-full bg-white/10 animate-float"
    style={{
      width: size,
      height: size,
      left,
      top,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
);

// Animated gradient orb
const GradientOrb: React.FC<{ className: string }> = ({ className }) => (
  <div className={`absolute rounded-full blur-3xl animate-pulse-slow ${className}`} />
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    // Start rocket launch animation
    setIsLaunching(true);

    // Wait for launch animation, then submit
    setTimeout(async () => {
      setIsSubmitting(true);
      setIsLaunching(false);
      const result = await signIn(email, password);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    }, 800);
  };

  // Demo credentials for easy testing
  const demoCredentials = [
    { role: 'Admin', email: 'sarah.jenkins@comprint.com', password: 'admin123' },
    { role: 'Sales Manager', email: 'michael.chen@comprint.com', password: 'manager123' },
    { role: 'Sales Rep', email: 'emily.rodriguez@comprint.com', password: 'sales123' },
    { role: 'Support', email: 'david.kim@comprint.com', password: 'support123' },
  ];

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const features = [
    { icon: TrendingUp, title: 'Pipeline Management', desc: 'Track deals from lead to close' },
    { icon: Users, title: 'Contact Management', desc: 'Organize all your relationships' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade data protection' },
    { icon: Sparkles, title: 'AI-Powered Insights', desc: 'Smart recommendations' },
  ];

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row overflow-hidden ${
      isDark ? 'bg-zinc-950' : 'bg-slate-50'
    }`}>
      {/* Left side - Branding with premium animations */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800">
          {/* Animated gradient orbs */}
          <GradientOrb className="w-96 h-96 bg-purple-500/30 -top-20 -left-20" />
          <GradientOrb className="w-[500px] h-[500px] bg-brand-400/20 bottom-0 right-0 translate-x-1/3 translate-y-1/3" />
          <GradientOrb className="w-64 h-64 bg-pink-500/20 top-1/2 left-1/3" />

          {/* Floating particles */}
          <FloatingParticle delay={0} duration={15} size={8} left="10%" top="20%" />
          <FloatingParticle delay={2} duration={20} size={12} left="25%" top="60%" />
          <FloatingParticle delay={4} duration={18} size={6} left="70%" top="30%" />
          <FloatingParticle delay={1} duration={22} size={10} left="85%" top="70%" />
          <FloatingParticle delay={3} duration={16} size={8} left="50%" top="10%" />
          <FloatingParticle delay={5} duration={19} size={14} left="15%" top="80%" />
          <FloatingParticle delay={2.5} duration={21} size={6} left="60%" top="85%" />
          <FloatingParticle delay={4.5} duration={17} size={10} left="40%" top="45%" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          {/* Logo and brand */}
          <div className={`transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl border border-white/10 group hover:scale-105 transition-transform">
                <Zap className="text-white group-hover:animate-pulse" size={32} />
              </div>
              <span className="text-4xl font-brand font-bold text-white tracking-tight">
                Comprint
              </span>
            </div>

            <h1 className={`text-5xl xl:text-6xl font-display font-bold text-white mb-6 leading-tight transform transition-all duration-1000 delay-200 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              Elevate Your<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white animate-gradient-x">
                Customer Relationships
              </span>
            </h1>
            <p className={`text-xl text-white/70 max-w-md transform transition-all duration-1000 delay-300 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              The modern CRM platform designed to help you close more deals, nurture leads, and grow your business.
            </p>
          </div>

          {/* Feature cards */}
          <div className={`grid grid-cols-2 gap-4 mb-8 transform transition-all duration-1000 delay-500 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 group cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <feature.icon className="text-white/80 mb-2 group-hover:text-white group-hover:scale-110 transition-all" size={24} />
                <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                <p className="text-white/60 text-xs mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className={`transform transition-all duration-1000 delay-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-white/30 to-white/10 border-2 border-white/30 flex items-center justify-center text-white font-medium text-sm shadow-lg backdrop-blur-sm hover:scale-110 hover:z-10 transition-transform"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {['SJ', 'MC', 'ER', 'DK', 'AL'][i - 1]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">10,000+ teams</p>
                <p className="text-white/60 text-sm">already using Comprint</p>
              </div>
            </div>
            <p className="text-white/40 text-sm">&copy; 2024 Comprint CRM. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className={`flex-1 flex items-center justify-center p-6 lg:p-12 relative ${
        isDark ? 'bg-zinc-950' : 'bg-slate-50'
      }`}>
        {/* Subtle background gradient for light mode */}
        {!isDark && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-50/30" />
        )}

        {/* Dark mode ambient glow */}
        {isDark && (
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
          </>
        )}

        <div className={`w-full max-w-md relative z-10 transform transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Zap className="text-white" size={28} />
            </div>
            <span className="text-3xl font-brand font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-700">
              Comprint
            </span>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className={`text-3xl font-display font-bold mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Welcome back
            </h2>
            <p className={isDark ? 'text-zinc-400' : 'text-slate-600'}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Error message with animation */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-shake ${
              isDark
                ? 'bg-red-900/20 border border-red-800'
                : 'bg-red-50 border border-red-200'
            }`}>
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className={isDark ? 'text-red-400 text-sm' : 'text-red-700 text-sm'}>{error}</p>
            </div>
          )}

          {/* Login form with glass effect */}
          <form onSubmit={handleSubmit} className={`space-y-5 p-6 rounded-2xl ${
            isDark
              ? 'bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl'
              : 'bg-white/80 border border-slate-200/50 shadow-xl shadow-slate-200/50 backdrop-blur-xl'
          }`}>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 ${
                    isDark
                      ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:bg-zinc-800'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                  }`}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border outline-none transition-all duration-300 ${
                      isDark
                        ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:bg-zinc-800'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLaunching}
              className={`w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative ${
                isLaunching ? 'rocket-launching' : ''
              } ${isSubmitting ? 'opacity-50' : ''}`}
            >
              {isLaunching ? (
                <div className="flex items-center justify-center gap-2 relative">
                  <div className="rocket-container">
                    <Rocket className="rocket-icon" size={20} />
                    <div className="rocket-flames">
                      <span className="flame flame-1"></span>
                      <span className="flame flame-2"></span>
                      <span className="flame flame-3"></span>
                    </div>
                  </div>
                  <span className="rocket-text">Launching...</span>
                  <div className="rocket-particles">
                    {[...Array(8)].map((_, i) => (
                      <span key={i} className={`particle particle-${i + 1}`}></span>
                    ))}
                  </div>
                </div>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                <>
                  <Rocket size={18} className="opacity-90" />
                  Launch
                  <Sparkles size={16} className="opacity-60" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials with hover effects */}
          <div className={`mt-6 p-5 rounded-2xl border transition-all duration-300 ${
            isDark
              ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
              : 'bg-white/50 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}>
            <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred, i) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillDemoCredentials(cred.email, cred.password)}
                  className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                    isDark
                      ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-transparent hover:border-zinc-700'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className={`font-medium block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    {cred.role}
                  </span>
                  <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                    Click to fill
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional info */}
          <p className={`text-center mt-6 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            By signing in, you agree to our{' '}
            <span className="text-brand-600 hover:text-brand-700 cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-brand-600 hover:text-brand-700 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.6; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.7; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        /* Rocket Launch Animations */
        @keyframes rocketLaunch {
          0% { transform: translateY(0) rotate(-45deg); }
          20% { transform: translateY(-2px) rotate(-45deg); }
          40% { transform: translateY(-4px) rotate(-45deg); }
          60% { transform: translateY(-8px) rotate(-45deg); }
          80% { transform: translateY(-20px) rotate(-45deg); opacity: 0.8; }
          100% { transform: translateY(-60px) rotate(-45deg); opacity: 0; }
        }

        @keyframes rocketShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-1px); }
          40% { transform: translateX(1px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }

        @keyframes flameFlicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 1; }
          25% { transform: scaleY(1.3) scaleX(0.8); opacity: 0.9; }
          50% { transform: scaleY(0.8) scaleX(1.2); opacity: 1; }
          75% { transform: scaleY(1.2) scaleX(0.9); opacity: 0.8; }
        }

        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes buttonGlow {
          0% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.4); }
          50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.8), 0 0 60px rgba(168, 85, 247, 0.4); }
          100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.4); }
        }

        .rocket-launching {
          animation: rocketShake 0.1s linear infinite, buttonGlow 0.8s ease-in-out;
        }

        .rocket-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rocket-icon {
          animation: rocketLaunch 0.8s ease-in forwards;
          transform: rotate(-45deg);
        }

        .rocket-flames {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          display: flex;
          gap: 2px;
        }

        .flame {
          width: 4px;
          height: 12px;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: flameFlicker 0.15s ease-in-out infinite;
        }

        .flame-1 {
          background: linear-gradient(to top, #ff6b35, #ffd93d);
          animation-delay: 0s;
          height: 14px;
        }

        .flame-2 {
          background: linear-gradient(to top, #ff4444, #ff9f43);
          animation-delay: 0.05s;
          height: 10px;
        }

        .flame-3 {
          background: linear-gradient(to top, #ff6b35, #ffd93d);
          animation-delay: 0.1s;
          height: 12px;
        }

        .rocket-text {
          animation: rocketShake 0.1s linear infinite;
        }

        .rocket-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd93d, #ff6b35);
        }

        .particle-1 { animation: particleExplode 0.6s ease-out forwards; left: 20%; top: 50%; --tx: -30px; --ty: -20px; }
        .particle-2 { animation: particleExplode 0.7s ease-out forwards; left: 80%; top: 50%; --tx: 30px; --ty: -15px; }
        .particle-3 { animation: particleExplode 0.5s ease-out forwards; left: 30%; top: 30%; --tx: -20px; --ty: -30px; }
        .particle-4 { animation: particleExplode 0.8s ease-out forwards; left: 70%; top: 70%; --tx: 25px; --ty: 20px; }
        .particle-5 { animation: particleExplode 0.55s ease-out forwards; left: 50%; top: 20%; --tx: 0px; --ty: -35px; }
        .particle-6 { animation: particleExplode 0.65s ease-out forwards; left: 40%; top: 80%; --tx: -15px; --ty: 25px; }
        .particle-7 { animation: particleExplode 0.75s ease-out forwards; left: 60%; top: 40%; --tx: 20px; --ty: -25px; }
        .particle-8 { animation: particleExplode 0.6s ease-out forwards; left: 25%; top: 60%; --tx: -35px; --ty: 10px; }

        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

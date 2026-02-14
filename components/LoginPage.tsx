import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import * as reactSpring from '@react-spring/three';

const LoginPage: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleQuickLogin = async () => {
    setEmail('superadmin@comprint.com');
    setPassword('superadmin123');
    setError('');
    const result = await signIn('superadmin@comprint.com', 'superadmin123');
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <>
      <style>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gradientRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .login-card-enter {
          animation: floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-card {
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%);
          backdrop-filter: blur(40px) saturate(150%);
          -webkit-backdrop-filter: blur(40px) saturate(150%);
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05), rgba(59,130,246,0.2), rgba(255,255,255,0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: borderGlow 3s ease-in-out infinite;
        }
        .glass-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .glass-input {
          background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-input:focus {
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.06) 100%);
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1), 0 0 20px rgba(59,130,246,0.1);
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          box-shadow: 0 0 20px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        .btn-glow:hover {
          box-shadow: 0 0 30px rgba(59,130,246,0.5), 0 4px 16px rgba(0,0,0,0.3);
          transform: translateY(-1px);
        }
        .btn-glow:active {
          transform: scale(0.98) translateY(0);
        }
        .btn-glow::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
          background-size: 200% 100%;
        }
      `}</style>
      <div className="min-h-screen flex bg-[#0a0a0f]">
        {/* Left Panel — Brand */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-center items-center bg-[#0a0a0f]">
          {/* ShaderGradient background */}
          <div className="absolute inset-0 opacity-60">
            <ShaderGradientCanvas
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <ShaderGradient
                control='query'
                urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=0.8&cAzimuthAngle=270&cDistance=0.5&cPolarAngle=180&cameraZoom=15.09&color1=%2373bfc4&color2=%232563eb&color3=%238da0ce&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=env&pixelDensity=1&positionX=-0.1&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.4&rotationX=0&rotationY=130&rotationZ=70&shader=defaults&type=sphere&uAmplitude=3.2&uDensity=0.8&uFrequency=5.5&uSpeed=0.3&uStrength=0.3&uTime=0&wireframe=false&zoomOut=false'
              />
            </ShaderGradientCanvas>
          </div>

          {/* Content */}
          <div className="relative z-10 px-12 text-center">
            {/* Logo */}
            <div className="comprint-logo text-[56px] justify-center mb-8">
              <span className="text-white">COMPRINT</span>
              <span className="comprint-dot bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
            <h2 className="text-white text-2xl font-semibold leading-snug">
              Manage your sales,<br />
              partners & growth.
            </h2>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 relative overflow-hidden bg-[#08080d]">
          {/* Ambient glow orbs */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
          {/* Mobile ShaderGradient background */}
          <div className="absolute inset-0 lg:hidden opacity-40">
            <ShaderGradientCanvas
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <ShaderGradient
                control='query'
                urlString='https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=0.8&cAzimuthAngle=270&cDistance=0.5&cPolarAngle=180&cameraZoom=15.09&color1=%2373bfc4&color2=%232563eb&color3=%238da0ce&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=env&pixelDensity=1&positionX=-0.1&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.4&rotationX=0&rotationY=130&rotationZ=70&shader=defaults&type=sphere&uAmplitude=3.2&uDensity=0.8&uFrequency=5.5&uSpeed=0.3&uStrength=0.3&uTime=0&wireframe=false&zoomOut=false'
              />
            </ShaderGradientCanvas>
          </div>
          <div className="relative z-10 w-full max-w-[420px]">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="comprint-logo text-[32px] justify-center">
                <span className="text-white">COMPRINT</span>
                <span className="comprint-dot bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              </div>
            </div>

            {/* Premium Glassmorphism card */}
            <div className="glass-card rounded-2xl p-9 login-card-enter">
              <h1 className="relative z-10 text-white text-[26px] font-bold mb-1 tracking-tight">
                Welcome back
              </h1>
              <p className="relative z-10 text-zinc-400 text-sm mb-8">
                Sign in to your account
              </p>

              {/* Error */}
              {error && (
                <div className="relative z-10 mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Password</label>
                    <button type="button" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="glass-input w-full pl-11 pr-11 py-3.5 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative z-10 flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="text-zinc-500 text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>

              {/* Quick Demo Login */}
              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={isLoading}
                className="relative z-10 w-full py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-medium text-sm hover:bg-white/[0.08] hover:border-white/[0.18] hover:text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                Quick Demo Login (Super Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

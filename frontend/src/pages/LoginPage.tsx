import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import * as reactSpring from '@react-spring/three';
import { Button, Input, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

const LoginPage: React.FC = () => {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes card-enter-3d {
          0% { opacity: 0; transform: perspective(1000px) rotateX(8deg) rotateY(-4deg) translateY(40px) translateZ(-30px) scale(0.95); }
          100% { opacity: 1; transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0px) scale(1); }
        }
        @keyframes edge-light {
          0%, 100% { opacity: 0.3; background-position: 0% 50%; }
          50% { opacity: 0.8; background-position: 100% 50%; }
        }
        .login-card-enter {
          animation: card-enter-3d 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-card-3d {
          --mouse-x: 50%;
          --mouse-y: 50%;
          position: relative;
          background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, rgba(10,10,20,0.4) 100%);
          backdrop-filter: blur(40px) saturate(150%);
          -webkit-backdrop-filter: blur(40px) saturate(150%);
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.08),
            0 8px 32px rgba(0,0,0,0.5),
            0 20px 60px rgba(0,0,0,0.4),
            0 2px 8px rgba(59,130,246,0.08),
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.2);
        }
        .glass-card-3d:hover {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.12),
            0 12px 40px rgba(0,0,0,0.6),
            0 30px 80px rgba(0,0,0,0.45),
            0 4px 16px rgba(59,130,246,0.15),
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.2);
        }
        /* Animated border gradient */
        .glass-card-3d::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 25px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(59,130,246,0.3), rgba(139,92,246,0.2), rgba(255,255,255,0.1), rgba(59,130,246,0.25));
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: edge-light 4s ease-in-out infinite;
        }
        /* Mouse-follow spotlight */
        .glass-card-3d::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), rgba(59,130,246,0.1), rgba(139,92,246,0.05) 40%, transparent 70%);
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .glass-card-3d:hover::after {
          opacity: 1;
        }
        /* Top light reflection */
        .glass-card-3d .card-reflection {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          border-radius: 50%;
          z-index: 2;
          pointer-events: none;
        }
        /* Noise texture overlay */
        .glass-card-3d .card-noise {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }
        /* Floating particles */
        .card-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(59,130,246,0.5);
          pointer-events: none;
          z-index: 0;
          animation: float-particle 6s ease-in-out infinite;
        }
        .glass-input {
          background: transparent !important;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #ffffff !important;
          caret-color: #ffffff;
          -webkit-text-fill-color: #ffffff;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05);
        }
        .glass-input::placeholder {
          color: #a1a1aa !important;
          -webkit-text-fill-color: #a1a1aa;
          opacity: 1;
        }
        .glass-input:focus {
          background: transparent !important;
          border-color: rgba(59,130,246,0.5);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(59,130,246,0.12), 0 0 30px rgba(59,130,246,0.08);
        }
        .glass-input:-webkit-autofill,
        .glass-input:-webkit-autofill:hover,
        .glass-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          box-shadow:
            0 0 20px rgba(59,130,246,0.35),
            0 6px 20px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset 0 -2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .btn-glow:hover {
          box-shadow:
            0 0 35px rgba(59,130,246,0.5),
            0 8px 30px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.25),
            inset 0 -2px 4px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
        .btn-glow:active {
          transform: scale(0.97) translateY(0);
          box-shadow:
            0 0 15px rgba(59,130,246,0.3),
            0 2px 8px rgba(0,0,0,0.4),
            inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .btn-glow::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
          background-size: 200% 100%;
        }
      `}</style>
      <div className="min-h-screen flex bg-[#0a0a0f]">
        {/* Left Panel -- Brand */}
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
              accounts & growth.
            </h2>
          </div>
        </div>

        {/* Right Panel -- Login Form */}
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

            {/* Premium 3D Glassmorphism card */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="glass-card-3d rounded-3xl p-9 login-card-enter"
            >
              {/* 3D depth layers */}
              <div className="card-reflection" />
              <div className="card-noise" />
              {/* Floating particles */}
              <div className="card-particle" style={{ top: '15%', left: '8%', animationDelay: '0s', animationDuration: '5s' }} />
              <div className="card-particle" style={{ top: '70%', right: '12%', animationDelay: '1.5s', animationDuration: '7s' }} />
              <div className="card-particle" style={{ top: '40%', left: '85%', animationDelay: '3s', animationDuration: '6s', background: 'rgba(139,92,246,0.4)' }} />
              <div className="card-particle" style={{ top: '85%', left: '25%', animationDelay: '4s', animationDuration: '8s', background: 'rgba(99,202,210,0.4)' }} />

              <h1 className="relative z-10 text-white text-[26px] font-bold mb-1 tracking-tight">
                Welcome back
              </h1>
              <p className="relative z-10 text-zinc-400 text-sm mb-8">
                Sign in to your account
              </p>

              {/* Error */}
              {error && (
                <div className="relative z-10 mb-5">
                  <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
                    {error}
                  </Alert>
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  icon={<Mail className="w-4 h-4" />}
                  className="glass-input !bg-transparent focus:!bg-transparent py-3.5 rounded-xl text-sm focus:outline-none"
                />

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <button type="button" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="glass-input w-full !bg-transparent focus:!bg-transparent pl-10 pr-11 py-3.5 rounded-xl text-white text-sm placeholder-zinc-400 focus:outline-none"
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
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  shine
                  className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm"
                >
                  Log in
                </Button>
              </form>

              {/* Divider */}
              <div className="relative z-10 flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="text-zinc-500 text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>

              {/* Quick Demo Login */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleQuickLogin}
                disabled={isLoading}
                className={cx(
                  'relative z-10 w-full py-3.5 rounded-xl',
                  'bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-medium text-sm',
                  'hover:bg-white/[0.08] hover:border-white/[0.16] hover:text-white',
                  'active:scale-[0.97] backdrop-blur-sm'
                )}
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.2)' }}
              >
                Quick Demo Login (Super Admin)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

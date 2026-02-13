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
    setEmail('admin@gmail.com');
    setPassword('1');
    setError('');
    const result = await signIn('admin@gmail.com', '1');
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0e0e12]">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-center items-center bg-[#0e0e12]">
        {/* ShaderGradient background */}
        <div className="absolute inset-0 opacity-50">
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
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 relative overflow-hidden bg-black">
        {/* Ambient glow effects */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/[0.05] rounded-full blur-3xl pointer-events-none" />
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
        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="comprint-logo text-[32px] justify-center">
              <span className="text-white">COMPRINT</span>
              <span className="comprint-dot bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
          </div>

          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <h1 className="text-white text-2xl font-bold mb-1.5">
              Login
            </h1>
            <p className="text-zinc-500 text-sm mb-8">
              Enter your credentials to continue
            </p>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 backdrop-blur-sm transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-400 text-sm font-medium">Password</label>
                  <button type="button" className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 backdrop-blur-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-zinc-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Quick Demo Login */}
            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quick Demo Login (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

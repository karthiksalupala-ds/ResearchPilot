import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLampOn, setIsLampOn] = useState(false);

    const cordY = useMotionValue(0);
    // Visual feedback: line extension
    const lineY2 = useTransform(cordY, (value) => 180 + value);
    const beadY = useTransform(cordY, (value) => 190 + value);

    const controls = useAnimation();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async () => {
        const currentY = cordY.get();
        if (currentY > 25) {
            // Toggle light state
            setIsLampOn(prev => !prev);
            // Play a click sound or simple feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
        // Snap back cord
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 15 } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-700">
            {/* Custom glowing background behind the modal */}
            <div 
                className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out ${
                    isLampOn ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                    background: 'radial-gradient(circle 450px at 50% 35%, rgba(251, 191, 36, 0.15), transparent 70%)'
                }}
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative w-full max-w-2xl overflow-hidden border rounded-3xl shadow-2xl transition-all duration-700 ${
                    isLampOn 
                        ? 'bg-amber-950/20 border-amber-500/30 shadow-amber-500/10' 
                        : 'bg-slate-950/70 border-white/10 shadow-black'
                }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row md:items-stretch">
                    {/* Interactive Lamp Section (Left Side) */}
                    <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b md:bg-gradient-to-r from-black/50 to-transparent w-full md:w-1/2 min-h-[320px]">
                        {/* Radial Glow under the lamp shade */}
                        <div 
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 scale-150 ${
                                isLampOn ? 'bg-amber-400/30 opacity-100' : 'bg-transparent opacity-0'
                            }`}
                        />

                        <svg className="w-44 h-44 drop-shadow-xl z-10" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
                            {/* Glow Ellipse */}
                            <ellipse 
                                className={`inner-glow-ellipse ${isLampOn ? 'inner-glow-on' : ''}`} 
                                cx="100" 
                                cy="90" 
                                rx="50" 
                                ry="20" 
                            />

                            {/* Lamp Base Stem */}
                            <rect className="lamp-base-rect" x="97" y="0" width="6" height="85" />

                            {/* Pull Cord */}
                            <motion.g
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 40 }}
                                dragElastic={0.1}
                                style={{ y: cordY }}
                                onDragEnd={handleDragEnd}
                                animate={controls}
                                className="cursor-pointer"
                                onClick={() => {
                                    setIsLampOn(!isLampOn);
                                }}
                            >
                                {/* SVG line and bead that follow movement */}
                                <motion.line 
                                    className="cord-line-svg" 
                                    x1="125" 
                                    y1="85" 
                                    x2="125" 
                                    y2={lineY2} 
                                />
                                <motion.circle 
                                    className="cord-bead-svg" 
                                    cx="125" 
                                    cy={beadY} 
                                    r="7" 
                                />
                                {/* Hit area */}
                                <circle cx="125" cy="190" r="25" fill="transparent" />
                            </motion.g>

                            {/* Lamp Shade */}
                            <path 
                                className={`lamp-shade-path ${isLampOn ? 'lamp-shade-on' : ''} cursor-pointer`} 
                                onClick={() => setIsLampOn(!isLampOn)}
                                d="M40 85 C 40 35, 160 35, 160 85 C 160 98, 40 98, 40 85 Z" 
                            />
                        </svg>

                        <div className="text-center mt-4 z-10">
                            <span className={`text-xs font-semibold uppercase tracking-widest transition-colors duration-500 ${
                                isLampOn ? 'text-amber-400' : 'text-slate-500'
                            }`}>
                                {isLampOn ? 'Light On • Auth Active' : 'Pull Cord to Start'}
                            </span>
                        </div>
                    </div>

                    {/* Login Form Container (Right Side) - fades in / slides up when lamp is active */}
                    <div className={`w-full md:w-1/2 p-8 flex flex-col justify-center login-form-lamp ${
                        isLampOn ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'
                    }`}>

                    <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-tight">
                        {isSignUp ? 'Create an Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="flex items-start gap-2 p-3 mb-4 text-sm text-red-200 bg-red-900/40 border border-red-500/20 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-slate-300">Email Address</label>
                            <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500 ${
                                    isLampOn ? 'text-amber-400/70' : 'text-slate-500'
                                }`} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-500"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500 ${
                                    isLampOn ? 'text-amber-400/70' : 'text-slate-500'
                                }`} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-500"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed login-btn-lamp"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </form>


                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className={`text-sm transition-colors duration-500 ${
                                isLampOn ? 'text-amber-400/80 hover:text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>
                </div>
            </motion.div>
        </div>
    );
}




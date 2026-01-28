'use client'

import Link from 'next/link'
import { Sprout, Mic, Globe, Brain, ArrowRight, CheckCircle, Leaf, Volume2 } from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Floating Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
                <nav className="max-w-7xl mx-auto glass-panel rounded-full px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Sprout className="w-6 h-6 text-emerald-400" />
                        <span className="text-xl font-bold tracking-tight">Harvest Tutor</span>
                    </div>
                    <Link
                        href="/diagnose"
                        className="glass-btn-primary py-2 px-6 text-sm"
                    >
                        Start Diagnosis
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative px-4 pt-32 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left Column - Text Content */}
                        <div className="text-white space-y-8 animate-slide-up relative z-10">
                            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                                Your Personal<br />
                                <span className="text-gradient">AI Agronomist</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-200 leading-relaxed max-w-lg font-light">
                                Identify crop diseases instantly. Get expert advice in your language.
                                Protect your harvest with premium AI guidance.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/diagnose"
                                    className="glass-btn-primary flex items-center justify-center gap-2 text-lg group"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="#features"
                                    className="glass-btn-secondary flex items-center justify-center gap-2 text-lg"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>

                        {/* Right Column - Visual Glass Card */}
                        <div className="relative animate-float">
                            <div className="glass-panel rounded-[2.5rem] p-8 border border-white/20 relative z-10 bg-gradient-to-br from-white/10 to-transparent">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="bg-emerald-500/20 p-4 rounded-2xl backdrop-blur-md border border-emerald-500/30">
                                            <Leaf className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Instant Disease Detection</p>
                                            <p className="text-sm text-emerald-100/70">Upload photo & get results</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="bg-blue-500/20 p-4 rounded-2xl backdrop-blur-md border border-blue-500/30">
                                            <Brain className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">AI-Powered Explanations</p>
                                            <p className="text-sm text-blue-100/70">Understand why it happened</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="bg-amber-500/20 p-4 rounded-2xl backdrop-blur-md border border-amber-500/30">
                                            <Volume2 className="w-8 h-8 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Voice Guidance</p>
                                            <p className="text-sm text-amber-100/70">Listen in your language</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Glow Behind Card */}
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10 rounded-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-4 py-24 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-slide-up">
                        <h2 className="text-4xl md:text-5xl mb-4 text-white">
                            Why Farmers Trust Us
                        </h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                            Built specifically for Indian farmers with accessibility and simplicity at its core
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-card p-8 group">
                            <div className="bg-emerald-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-emerald-500/20">
                                <Mic className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl text-white mb-3">Voice-First Design</h3>
                            <p className="text-slate-300 leading-relaxed">
                                No reading required. Listen to advice in your local language with clear, simple explanations.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass-card p-8 group">
                            <div className="bg-blue-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                                <Globe className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-2xl text-white mb-3">Multilingual Support</h3>
                            <p className="text-slate-300 leading-relaxed">
                                Works in English, Hindi, Telugu, Tamil, Bengali, Marathi, and more. Speak your language.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass-card p-8 group">
                            <div className="bg-amber-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-amber-500/20">
                                <Brain className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-2xl text-white mb-3">Educational AI</h3>
                            <p className="text-slate-300 leading-relaxed">
                                Don't just get a diagnosis. Learn why it happened, how to prevent it, and become a better farmer.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="px-4 py-24">
                <div className="max-w-7xl mx-auto glass-panel rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-4xl md:text-5xl mb-4 text-white">
                            Simple. Fast. Effective.
                        </h2>
                        <p className="text-xl text-slate-300">
                            Get expert advice in 3 easy steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative z-10">
                        {[
                            { step: 1, title: 'Upload Photo', desc: 'Take a clear picture of the affected leaf or plant' },
                            { step: 2, title: 'AI Analysis', desc: 'Identifies the disease and understands the cause in seconds' },
                            { step: 3, title: 'Get Guidance', desc: 'Listen to personalized treatment advice and prevention tips' },
                        ].map((item) => (
                            <div key={item.step} className="text-center space-y-4">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto text-4xl font-bold glass-panel border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    {item.step}
                                </div>
                                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                                <p className="text-slate-300">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16 relative z-10">
                        <Link
                            href="/diagnose"
                            className="glass-btn-primary inline-flex items-center gap-2 text-xl px-12 py-5"
                        >
                            Try It Now - It's Free
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Supported Crops */}
            <section className="px-4 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 h-full">
                        <h2 className="text-4xl md:text-5xl mb-4 text-white">
                            Supported Crops
                        </h2>
                        <p className="text-xl text-slate-300">
                            Currently supporting major Indian crops
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="glass-card p-10 text-center border-t-4 border-t-red-500/50">
                            <div className="text-7xl mb-6 filter drop-shadow-lg transform hover:scale-110 transition-transform">🍅</div>
                            <h3 className="text-2xl font-bold text-white">Tomato</h3>
                            <p className="text-slate-400 mt-2">10+ disease types</p>
                        </div>
                        <div className="glass-card p-10 text-center border-t-4 border-t-yellow-500/50">
                            <div className="text-7xl mb-6 filter drop-shadow-lg transform hover:scale-110 transition-transform">🥔</div>
                            <h3 className="text-2xl font-bold text-white">Potato</h3>
                            <p className="text-slate-400 mt-2">8+ disease types</p>
                        </div>
                        <div className="glass-card p-10 text-center border-t-4 border-t-green-500/50">
                            <div className="text-7xl mb-6 filter drop-shadow-lg transform hover:scale-110 transition-transform">🍎</div>
                            <h3 className="text-2xl font-bold text-white">Apple</h3>
                            <p className="text-slate-400 mt-2">6+ disease types</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 border-t border-white/10 bg-black/20 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-3 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sprout className="w-6 h-6 text-emerald-400" />
                                <span className="text-xl font-bold text-white">Harvest Tutor</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Empowering farmers with AI-driven agricultural knowledge and voice-first accessibility.
                                Designed for accessibility and ease of use.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg mb-4">Features</h3>
                            <ul className="space-y-3 text-slate-400 text-sm">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    Disease Detection
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    Voice Guidance
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    Multilingual Support
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg mb-4">Supported Languages</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                English, Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-8 text-center text-slate-500 text-sm">
                        <p>© 2026 Harvest Tutor. Built with ❤️ for Indian farmers.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

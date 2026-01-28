'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sprout, Loader2, AlertCircle, CheckCircle2, Home, Volume2, Play } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import AudioPlayer from '@/components/AudioPlayer'
import { predictDisease, getExplanation, generateVoice } from '@/lib/api'

const CROPS = [
    { name: 'Tomato', icon: '🍅' },
    { name: 'Potato', icon: '🥔' },
    { name: 'Apple', icon: '🍎' },
]

const LANGUAGES = [
    { name: 'English', code: 'en', flag: '🇬🇧' },
    { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
    { name: 'Telugu', code: 'te', flag: '🇮🇳' },
    { name: 'Tamil', code: 'ta', flag: '🇮🇳' },
    { name: 'Bengali', code: 'bn', flag: '🇮🇳' },
    { name: 'Marathi', code: 'mr', flag: '🇮🇳' },
]

type AnalysisState = 'idle' | 'predicting' | 'explaining' | 'generating-voice' | 'complete' | 'error'

export default function DiagnosePage() {
    const [selectedCrop, setSelectedCrop] = useState<string>('Tomato')
    const [selectedLanguage, setSelectedLanguage] = useState<string>('English')
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
    const [disease, setDisease] = useState<string>('')
    const [confidence, setConfidence] = useState<number>(0)
    const [explanation, setExplanation] = useState<string>('')
    const [audioBase64, setAudioBase64] = useState<string>('')
    const [error, setError] = useState<string>('')

    const handleImageSelect = (file: File) => {
        setSelectedImage(file)
        setAnalysisState('idle')
        setDisease('')
        setExplanation('')
        setAudioBase64('')
        setError('')
    }

    const handleClearImage = () => {
        setSelectedImage(null)
        setAnalysisState('idle')
        setDisease('')
        setExplanation('')
        setAudioBase64('')
        setError('')
    }

    const handleAnalyze = async () => {
        if (!selectedImage) {
            setError('Please upload an image first')
            return
        }

        try {
            setAnalysisState('predicting')
            setError('')

            const predictionResult = await predictDisease(selectedImage, selectedCrop)

            if (!predictionResult.success || !predictionResult.disease) {
                throw new Error(predictionResult.error || 'Failed to predict disease')
            }

            setDisease(predictionResult.disease)
            setConfidence(predictionResult.confidence || 0)

            setAnalysisState('explaining')

            const explanationResult = await getExplanation(
                selectedCrop,
                predictionResult.disease,
                selectedLanguage
            )

            // Graceful fallback for explanation
            const explText = explanationResult.success && explanationResult.explanation
                ? explanationResult.explanation
                : "Expert explanation currently unavailable. Please check the disease name and consult a local agronomist."

            setExplanation(explText)

            setAnalysisState('generating-voice')

            const voiceResult = await generateVoice(explText, selectedLanguage)

            if (voiceResult.success && voiceResult.audioBase64) {
                setAudioBase64(voiceResult.audioBase64)
            } else {
                setAudioBase64('')
            }

            setAnalysisState('complete')

        } catch (err) {
            console.error('Analysis error:', err)
            setError(err instanceof Error ? err.message : 'An error occurred during analysis')
            setAnalysisState('error')
        }
    }

    const getLoadingMessage = () => {
        switch (analysisState) {
            case 'predicting': return 'Analyzing crop image...'
            case 'explaining': return 'Getting expert explanation...'
            case 'generating-voice': return 'Generating voice guidance...'
            default: return 'Processing...'
        }
    }

    const isLoading = ['predicting', 'explaining', 'generating-voice'].includes(analysisState)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="px-4 py-4 fixed w-full top-0 z-50">
                <nav className="max-w-7xl mx-auto glass-panel rounded-full px-6 py-3 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="font-medium hidden sm:inline">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2 text-white">
                        <Sprout className="w-6 h-6 text-emerald-400" />
                        <span className="text-lg font-bold">Harvest Tutor</span>
                    </div>
                </nav>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-32 pb-12">
                <div className="text-center mb-10 animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-lg">
                        <span className="text-gradient">Crop Disease Diagnosis</span>
                    </h1>
                    <p className="text-lg text-slate-300">
                        Upload a photo and get instant AI-powered analysis
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Input Section */}
                    <div className="space-y-6">
                        {/* Crop Selection */}
                        <div className="glass-panel rounded-3xl p-6 animate-slide-up">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-emerald-500/30">1</span>
                                Select Crop
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {CROPS.map((crop) => (
                                    <button
                                        key={crop.name}
                                        onClick={() => setSelectedCrop(crop.name)}
                                        className={`
                                            p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                                            ${selectedCrop === crop.name
                                                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{crop.icon}</div>
                                        <div className="font-semibold text-white">{crop.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Selection */}
                        <div className="glass-panel rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-emerald-500/30">2</span>
                                Choose Language
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.name}
                                        onClick={() => setSelectedLanguage(lang.name)}
                                        className={`
                                            p-3 rounded-lg border transition-all duration-300
                                            ${selectedLanguage === lang.name
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/30'
                                            }
                                        `}
                                    >
                                        <div className="text-2xl mb-1">{lang.flag}</div>
                                        <div className="text-sm font-medium">{lang.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="glass-panel rounded-3xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-emerald-500/30">3</span>
                                Upload Image
                            </h2>
                            <ImageUpload
                                onImageSelect={handleImageSelect}
                                selectedImage={selectedImage}
                                onClear={handleClearImage}
                            />
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedImage || isLoading}
                            className={`
                                w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl flex items-center justify-center gap-3 relative overflow-hidden
                                ${!selectedImage || isLoading
                                    ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'glass-btn-primary hover:scale-[1.02]'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {getLoadingMessage()}
                                </>
                            ) : (
                                <>
                                    <Sprout className="w-6 h-6" />
                                    Analyze Crop
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Column - Results Section */}
                    <div className="space-y-6">
                        {error && (
                            <div className="glass-panel border-red-500/30 bg-red-500/10 p-6 rounded-2xl animate-slide-up">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-red-200 mb-1">Error</h3>
                                        <p className="text-red-100/80">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {disease && (
                            <div className="glass-card p-8 animate-slide-up border-emerald-500/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    <h2 className="text-2xl font-bold text-white">Disease Detected</h2>
                                </div>

                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
                                    <h3 className="text-3xl font-bold text-emerald-100 mb-2">{disease}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-emerald-200/70">Confidence:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30`}>
                                            {(confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-300">
                                    <p><strong className="text-emerald-400">Crop:</strong> {selectedCrop}</p>
                                    <p><strong className="text-emerald-400">Language:</strong> {selectedLanguage}</p>
                                </div>
                            </div>
                        )}

                        {explanation && (
                            <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <h2 className="text-2xl font-bold text-white mb-4">Expert Explanation</h2>
                                <div className="prose prose-invert prose-lg max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-200 leading-relaxed font-light">
                                        {explanation}
                                    </div>
                                </div>
                            </div>
                        )}

                        {audioBase64 && (
                            <div className="glass-panel p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <AudioPlayer
                                    audioBase64={audioBase64}
                                    language={selectedLanguage}
                                    text={explanation}
                                />
                            </div>
                        )}

                        {/* Web Speech API Fallback */}
                        {explanation && !audioBase64 && analysisState === 'complete' && (
                            <div className="glass-panel p-6 rounded-2xl animate-slide-up">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-amber-500/20 p-3 rounded-full border border-amber-500/30">
                                        <Volume2 className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Voice Guidance</h3>
                                        <p className="text-sm text-slate-400">Click to listen in {selectedLanguage}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const utterance = new SpeechSynthesisUtterance(explanation);
                                        // Simple locale mapping
                                        const langMap: any = { 'Hindi': 'hi-IN', 'English': 'en-US' };
                                        utterance.lang = langMap[selectedLanguage] || 'en-US';
                                        speechSynthesis.speak(utterance);
                                    }}
                                    className="w-full glass-btn-secondary flex items-center justify-center gap-2 mb-2"
                                >
                                    <Play className="w-5 h-5" />
                                    Listen to Explanation
                                </button>
                            </div>
                        )}

                        {/* Idle State Placeholder */}
                        {analysisState === 'idle' && !error && (
                            <div className="glass-panel border-dashed border-white/10 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center">
                                <div className="bg-white/5 p-6 rounded-full mb-4">
                                    <Sprout className="w-12 h-12 text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-lg">
                                    Results will appear here after analysis
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

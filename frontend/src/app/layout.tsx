import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Harvest Tutor - AI-Powered Crop Disease Advisor',
    description: 'Voice-first agricultural assistant helping farmers identify and treat crop diseases using AI. Multilingual support in English, Hindi, Telugu, and more.',
    keywords: 'agriculture, farming, crop disease, AI, machine learning, voice assistant, multilingual, India',
    authors: [{ name: 'Harvest Tutor Team' }],
    openGraph: {
        title: 'Harvest Tutor - AI-Powered Crop Disease Advisor',
        description: 'Empowering farmers with AI-driven crop disease diagnosis and treatment advice',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <head>
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>" />
            </head>
            <body className="antialiased min-h-screen bg-slate-950 selection:bg-emerald-500/30 selection:text-emerald-100">
                {/* Fixed Background Mesh - Pure CSS, Lightweight */}
                <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen animate-float" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen animate-float-delayed" />
                </div>
                {children}
            </body>
        </html>
    )
}

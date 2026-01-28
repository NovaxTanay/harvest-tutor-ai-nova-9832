'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
    onImageSelect: (file: File) => void
    selectedImage: File | null
    onClear: () => void
}

export default function ImageUpload({ onImageSelect, selectedImage, onClear }: ImageUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }, [])

    const handleFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB')
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        onImageSelect(file)
    }

    const handleClear = () => {
        setPreview(null)
        onClear()
    }

    return (
        <div className="w-full">
            {!preview ? (
                <div
                    className={`
            relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer group
            ${dragActive
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                            : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
                        }
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        aria-label="Upload crop image"
                    />

                    <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center gap-4 cursor-pointer"
                    >
                        <div className={`
                            p-6 rounded-full transition-transform duration-300 group-hover:scale-110
                            ${dragActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-emerald-500/10'}
                        `}>
                            <Upload className={`w-12 h-12 transition-colors duration-300 ${dragActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-white mb-2">
                                Upload Crop Image
                            </p>
                            <p className="text-slate-400">
                                Drag & drop or <span className="text-emerald-400 font-medium underline decoration-emerald-500/30 underline-offset-4">browse</span>
                            </p>
                            <p className="text-sm text-slate-500 mt-4">
                                Supports: JPG, PNG (Max 10MB)
                            </p>
                        </div>
                    </label>
                </div>
            ) : (
                <div className="relative glass-panel rounded-2xl overflow-hidden group">
                    <button
                        onClick={handleClear}
                        className="absolute top-4 right-4 z-10 glass-btn backdrop-blur-md bg-black/40 hover:bg-red-500/80 p-2 rounded-full transition-all duration-300 transform hover:scale-110 border border-white/10"
                        aria-label="Remove image"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="relative flex justify-center bg-black/20 p-4">
                        <img
                            src={preview}
                            alt="Uploaded crop"
                            className="w-full h-auto max-h-96 object-contain rounded-lg"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-center gap-2 text-white">
                                <ImageIcon className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-medium truncate">
                                    {selectedImage?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

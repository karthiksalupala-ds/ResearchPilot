import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
    userId: string;
    onUploadSuccess?: () => void;
}

export default function FileUpload({ userId, onUploadSuccess }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        if (!f.type.includes('pdf')) {
            alert('Please upload a PDF file.');
            return;
        }
        setFile(f);
        setStatus('idle');
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const uploadFile = async () => {
        if (!file) return;
        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/library/upload?user_id=${userId}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            setStatus('success');
            setMessage('PDF successfully indexed into your personal library.');
            onUploadSuccess?.();
            setTimeout(() => { setFile(null); setStatus('idle'); }, 3000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to upload PDF.');
        }
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer text-center ${isDragging
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onSelect}
                    className="hidden"
                    accept=".pdf"
                />

                {!file ? (
                    <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-300">Drop PDF here or click to browse</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Supports up to 50MB · Indexed for RAG</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-brand-400" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-500 italic">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="p-1.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {file && status === 'idle' && (
                <button
                    onClick={uploadFile}
                    className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Start Indexing
                </button>
            )}

            {status === 'uploading' && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                    <p className="text-sm font-medium text-brand-300">Analyzing & Indexing PDF chunks...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-300">{message}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm font-medium text-red-300">{message}</p>
                </div>
            )}
        </div>
    );
}

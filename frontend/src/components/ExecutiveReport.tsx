import React, { useState, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../lib/types';
import type { Components } from 'react-markdown';

interface ExecutiveReportProps {
    result: AnalysisResult;
}

export const PapersContext = createContext<any[]>([]);

const normalizeUrl = (u: string): string => {
    if (!u) return '';
    return u.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
};

const CitationLink = ({ href, label }: { href: string; label: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const papers = useContext(PapersContext);
    
    // Find matching paper using robust fallbacks (URL, ID, index-based href, index-based label)
    const paper = papers?.find((p, idx) => {
        if (!href) return false;
        if (p.url && normalizeUrl(p.url) === normalizeUrl(href)) return true;
        if (p.id && href.includes(p.id)) return true;
        
        const indexMatch = href.match(/paper-(\d+)/);
        if (indexMatch && parseInt(indexMatch[1], 10) === idx) return true;
        
        const labelMatch = label.match(/^(\d+)\b/);
        if (labelMatch && parseInt(labelMatch[1], 10) - 1 === idx) return true;

        if (p.source && label.toLowerCase().includes(p.source.toLowerCase())) {
            if (p.year && label.includes(String(p.year))) return true;
        }
        return false;
    });

    // Dynamically clean label (e.g. "1 · 2020" -> "PubMed • 2020")
    const cleanLabel = paper
        ? `${paper.source || 'Scholar'} • ${paper.year || 'N/A'}`
        : label;

    if (!paper) {
        return (
            <a
                href={href || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title="View source"
                className="citation-chip inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-slate-300 no-underline hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors align-baseline font-sans"
            >
                <span className="max-w-[180px] truncate">{cleanLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-65 flex-shrink-0" />
            </a>
        );
    }

    const getReliabilityScore = (p: any): number => {
        const src = (p.source || '').toLowerCase();
        if (src.includes('pubmed')) return 9.5;
        if (src.includes('arxiv')) return 8.5;
        if (src.includes('scholar') || src.includes('semantic')) return 9.0;
        if (src.includes('wikipedia')) return 7.0;
        if (p.id?.startsWith('web-')) return 6.5;
        return 8.0;
    };

    const relScore = getReliabilityScore(paper);

    return (
        <span 
            className="relative inline-block align-baseline"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <a
                href={paper.url || href || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-chip inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 font-semibold text-[10px] no-underline hover:bg-indigo-500/20 transition-all font-sans"
            >
                {cleanLabel}
            </a>
            
            {isHovered && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 text-left block pointer-events-auto leading-normal font-sans">
                    <span className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                            {paper.source || 'Academic Source'} • {paper.year || 'N/A'}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Reliability: {relScore}/10
                        </span>
                    </span>
                    <span className="block text-xs font-bold text-slate-100 mb-1 leading-snug line-clamp-2">
                        {paper.title}
                    </span>
                    {paper.authors && paper.authors.length > 0 && (
                        <span className="block text-[10px] text-slate-400 mb-2 truncate">
                            {paper.authors.join(', ')}
                        </span>
                    )}
                    {paper.abstract && (
                        <span className="block text-[10px] text-slate-350 leading-relaxed mb-3 line-clamp-3 bg-black/20 p-2 rounded border border-white/5">
                            {paper.abstract}
                        </span>
                    )}
                    <span className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                        {paper.citations !== undefined && (
                            <span className="text-[10px] text-slate-550">
                                Citations: <strong className="text-slate-300 font-mono">{paper.citations}</strong>
                            </span>
                        )}
                        <a
                            href={paper.url || href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-wider transition-colors"
                        >
                            Open Paper
                            <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </span>
                </span>
            )}
        </span>
    );
};

export const reportMarkdownComponents: Components = {
    a: ({ href, children }) => {
        const label = String(children ?? 'Source');
        const isCitation = /•|·|\d{4}|arxiv|pubmed|scholar|doi/i.test(label) || /•|·/.test(label);
        if (isCitation || (href && href !== '#')) {
            return <CitationLink href={href || ''} label={label} />;
        }
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                {children}
            </a>
        );
    },
    h1: ({ children }) => (
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-100 mt-10 mb-4 border-b border-slate-800/40 pb-2 first:mt-0 font-sans uppercase tracking-wider">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-md md:text-lg font-bold tracking-tight text-slate-100 mt-8 mb-3 first:mt-0 font-sans uppercase tracking-wider">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm md:text-md font-bold tracking-tight text-slate-200 mt-6 mb-2 first:mt-0 font-sans">
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-slate-300 leading-relaxed mb-5 last:mb-0 text-sm md:text-[15px]">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="my-3 space-y-2.5 list-none pl-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="my-3 space-y-2 list-decimal pl-5 text-slate-300 text-sm md:text-[15px]">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="relative pl-5 text-slate-300 leading-relaxed text-sm md:text-[15px] before:content-['•'] before:absolute before:left-1 before:text-slate-500 before:font-bold">
            {children}
        </li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-5 border-l border-indigo-500/60 bg-indigo-500/5 px-4 py-2 text-slate-200 not-italic text-sm md:text-[14px]">
            {children}
        </blockquote>
    ),
    strong: ({ children }) => (
        <strong className="text-slate-100 font-semibold">{children}</strong>
    ),
    hr: () => (
        <hr className="my-8 border-slate-800/50" />
    )
};

export const ExecutiveReport = React.memo<ExecutiveReportProps>(({ result }) => {
    const papers = result.papers || [];
    const paperCount = papers.length;

    return (
        <article className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans">
            {/* Minimal Document Header */}
            <div className="flex flex-col gap-2 pb-6 border-b border-slate-800/40">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Research Report Summary
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
                    {result.refined_question || result.original_query}
                </h2>
                {paperCount > 0 && (
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                        Generated from {paperCount} academic source{paperCount > 1 ? 's' : ''} • Last updated: just now.
                    </div>
                )}
            </div>

            {/* Document Content */}
            <PapersContext.Provider value={papers}>
                <div className="research-document py-4 text-slate-300 leading-relaxed max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                        {result.final_insight}
                    </ReactMarkdown>
                </div>
            </PapersContext.Provider>
        </article>
    );
});

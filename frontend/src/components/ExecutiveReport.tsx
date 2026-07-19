import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Download, Share2, Map, BookOpen, ExternalLink } from 'lucide-react';
import type { AnalysisResult } from '../lib/types';
import type { Components } from 'react-markdown';

interface ExecutiveReportProps {
    result: AnalysisResult;
}

/** Perplexity-style citation chips; open source URLs in a new tab. */
export const reportMarkdownComponents: Components = {
    a: ({ href, children }) => {
        const label = String(children ?? 'Source');
        const isCitation = /·|\d{4}|arxiv|pubmed|scholar|doi/i.test(label) || /·/.test(label);
        if (isCitation || (href && href !== '#')) {
            return (
                <a
                    href={href || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View source"
                    className="citation-chip inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-300 no-underline hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors align-baseline"
                >
                    <span className="max-w-[180px] truncate">{label}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                </a>
            );
        }
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                {children}
            </a>
        );
    },
    h3: ({ children }) => (
        <h3 className="text-lg font-semibold tracking-tight text-slate-100 mt-10 mb-3 first:mt-0 border-b border-slate-800/80 pb-2">
            {children}
        </h3>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl font-semibold tracking-tight text-slate-100 mt-10 mb-4">{children}</h2>
    ),
    p: ({ children }) => (
        <p className="text-slate-300 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="my-3 space-y-2 list-none pl-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="my-3 space-y-2 list-decimal pl-5 text-slate-300">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="relative pl-5 text-slate-300 leading-relaxed before:content-[''] before:absolute before:left-1 before:top-[0.55em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-400/70">
            {children}
        </li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-5 border-l-2 border-indigo-500 bg-indigo-500/5 px-5 py-3 rounded-r-lg text-slate-200 not-italic">
            {children}
        </blockquote>
    ),
    strong: ({ children }) => (
        <strong className="text-slate-100 font-semibold">{children}</strong>
    ),
};

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ result }) => {
    return (
        <article className="bg-[#020617] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-base font-medium text-slate-200">Executive Summary</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled
                        title="Coming soon"
                        className="p-2 text-slate-600 cursor-not-allowed rounded opacity-50"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled
                        title="Coming soon"
                        className="p-2 text-slate-600 cursor-not-allowed rounded opacity-50"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-8 md:p-12 max-w-none">
                <div className="research-document">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                        {result.final_insight}
                    </ReactMarkdown>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {result.research_strategy && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-400">
                                <Map className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Research Strategy</h3>
                            </div>
                            <div className="text-sm text-slate-400 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                                    {result.research_strategy}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {result.key_evidence && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-purple-400">
                                <BookOpen className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Key Evidence</h3>
                            </div>
                            <div className="text-sm text-slate-400 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                                    {result.key_evidence}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};

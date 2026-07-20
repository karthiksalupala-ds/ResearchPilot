import { useState, useMemo } from 'react';
import type { AnalysisResult, ResearchPaper } from '../lib/types';
import { BookOpen, ExternalLink, Calendar, User, Search, SortAsc, Filter, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceExplorerProps {
    result: AnalysisResult;
}

type FilterType = 'all' | 'pubmed' | 'arxiv' | 'semantic_scholar' | 'web';
type SortType = 'relevant' | 'citations' | 'newest';

export default function SourceExplorer({ result }: SourceExplorerProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('relevant');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

    const papers = useMemo(() => result.papers || [], [result]);

    // Calculate reliability score on the fly based on paper attributes
    const getReliabilityScore = (paper: ResearchPaper): number => {
        const src = (paper.source || '').toLowerCase();
        if (src.includes('pubmed')) return 9.5;
        if (src.includes('arxiv')) return 8.5;
        if (src.includes('scholar') || src.includes('semantic')) return 9.0;
        if (src.includes('wikipedia')) return 7.0;
        if (paper.id?.startsWith('web-')) return 6.5; // Scraped web results
        return 8.0; // Default academic/web reference
    };

    const getSourceDisplayName = (source?: string): string => {
        const src = (source || '').toLowerCase();
        if (src.includes('pubmed')) return 'PubMed Central';
        if (src.includes('arxiv')) return 'arXiv e-Print';
        if (src.includes('scholar') || src.includes('semantic')) return 'Semantic Scholar';
        if (src.includes('wikipedia')) return 'Wikipedia Reference';
        if (src === 'google') return 'Google Search';
        if (src === 'duckduckgo') return 'DuckDuckGo Web';
        return source || 'Web Source';
    };

    const getSourceBadgeClass = (source?: string): string => {
        const src = (source || '').toLowerCase();
        if (src.includes('pubmed')) return 'text-teal-400 bg-teal-400/10 border-teal-500/20';
        if (src.includes('arxiv')) return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
        if (src.includes('scholar') || src.includes('semantic')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
        if (src.includes('wikipedia')) return 'text-sky-400 bg-sky-400/10 border-sky-500/20';
        return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
    };

    // Filtered & Sorted Papers
    const processedPapers = useMemo(() => {
        let items = [...papers];

        // 1. Source Database Filter
        if (filter !== 'all') {
            items = items.filter(p => {
                const src = (p.source || '').toLowerCase();
                if (filter === 'pubmed') return src.includes('pubmed');
                if (filter === 'arxiv') return src.includes('arxiv');
                if (filter === 'semantic_scholar') return src.includes('scholar') || src.includes('semantic');
                if (filter === 'web') return p.id?.startsWith('web-') || src.includes('google') || src.includes('duckduckgo');
                return true;
            });
        }

        // 2. Search Text Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            items = items.filter(p => 
                p.title.toLowerCase().includes(query) ||
                (p.abstract || '').toLowerCase().includes(query) ||
                (p.authors || []).some(a => a.toLowerCase().includes(query))
            );
        }

        // 3. Sorting
        items.sort((a, b) => {
            if (sortBy === 'citations') {
                return (b.citations || 0) - (a.citations || 0);
            }
            if (sortBy === 'newest') {
                return (b.year || 0) - (a.year || 0);
            }
            // 'relevant' - default natural database order/orchestrator ranking
            return 0; 
        });

        return items;
    }, [papers, filter, sortBy, searchQuery]);

    if (papers.length === 0) {
        return (
            <div className="glass-premium rounded-3xl p-8 border border-white/5 text-center">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Only partial evidence could be retrieved. Some databases were unavailable.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filter, Search & Sort Control Panel */}
            <div className="glass-premium rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search analyzed papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none placeholder-slate-500 transition-colors"
                    />
                </div>

                {/* Filter & Sort Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Database Filter */}
                    <div className="flex items-center gap-1.5 bg-black/30 border border-slate-800 rounded-xl px-2.5 py-1.5 font-sans">
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer font-medium"
                        >
                            <option value="all">All Databases</option>
                            <option value="pubmed">PubMed Central</option>
                            <option value="arxiv">arXiv</option>
                            <option value="semantic_scholar">Semantic Scholar</option>
                            <option value="web">Web Scraped</option>
                        </select>
                    </div>

                    {/* Sorting Selector */}
                    <div className="flex items-center gap-1.5 bg-black/30 border border-slate-800 rounded-xl px-2.5 py-1.5 font-sans">
                        <SortAsc className="w-3.5 h-3.5 text-slate-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortType)}
                            className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer font-medium"
                        >
                            <option value="relevant">Most Relevant</option>
                            <option value="citations">Most Cited</option>
                            <option value="newest">Newest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Total Results Label */}
            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                <span>Showing {processedPapers.length} of {papers.length} analyzed sources</span>
                <span>Generated from {papers.length} academic sources</span>
            </div>

            {/* List of Sources */}
            <div className="space-y-4">
                {processedPapers.length === 0 ? (
                    <div className="glass-premium rounded-2xl p-12 border border-white/5 text-center text-slate-500 text-sm">
                        No sources match your search or filter criteria.
                    </div>
                ) : (
                    processedPapers.map((paper) => {
                        const score = getReliabilityScore(paper);
                        const isExpanded = expandedPaperId === paper.id;
                        return (
                            <div
                                key={paper.id}
                                className="glass-premium rounded-2xl border border-white/5 hover:border-slate-700/80 p-5 md:p-6 transition-all duration-300 shadow-md hover:shadow-xl bg-slate-950/20 group"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        {/* Database + Year Tags */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getSourceBadgeClass(paper.source)}`}>
                                                {getSourceDisplayName(paper.source)}
                                            </span>
                                            {paper.year && (
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                                                    <Calendar className="w-3 h-3 text-slate-500" />
                                                    {paper.year}
                                                </span>
                                            )}
                                        </div>

                                        {/* Paper Title */}
                                        <h4 className="text-sm md:text-base font-bold text-slate-200 group-hover:text-white transition-colors leading-snug">
                                            {paper.title}
                                        </h4>

                                        {/* Authors */}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <User className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="truncate">{paper.authors?.join(', ') || 'Unknown Authors'}</span>
                                        </div>
                                    </div>

                                    {/* Metrics Column (Citations & Reliability) */}
                                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:gap-2 self-stretch md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                        {/* Citations Count */}
                                        {paper.citations !== undefined && (
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold block">Citations</span>
                                                <span className="text-xs font-bold text-slate-300 font-mono">{paper.citations}</span>
                                            </div>
                                        )}

                                        {/* Reliability Score */}
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Reliability</span>
                                            <span className="text-xs font-bold text-indigo-400 font-mono">{score}/10</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Abstract preview / full abstract */}
                                {paper.abstract && (
                                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                        <div 
                                            className={`text-xs text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}
                                        >
                                            {paper.abstract}
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            {/* Expand/Collapse Button */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedPaperId(isExpanded ? null : (paper.id || null))}
                                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white font-bold uppercase transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        Show Less
                                                        <ChevronUp className="w-3 h-3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Read Abstract
                                                        <ChevronDown className="w-3 h-3" />
                                                    </>
                                                )}
                                            </button>

                                            {/* Open Link Button */}
                                            {paper.url && (
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wide transition-colors"
                                                >
                                                    Open Paper
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

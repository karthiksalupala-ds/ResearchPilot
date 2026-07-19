import { ExternalLink, Users, Calendar, Quote } from 'lucide-react';
import type { ResearchPaper } from '../lib/types';

interface PaperCardProps {
    paper: ResearchPaper;
    index: number;
}

const SOURCE_STYLES: Record<string, string> = {
    arxiv: 'badge-arxiv',
    semantic_scholar: 'badge-semantic',
    pubmed: 'badge-pubmed',
};

const SOURCE_LABELS: Record<string, string> = {
    arxiv: 'arXiv',
    semantic_scholar: 'Semantic Scholar',
    pubmed: 'PubMed',
};

export default function PaperCard({ paper, index }: PaperCardProps) {
    const badgeClass = SOURCE_STYLES[paper.source] ?? 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    const sourceLabel = SOURCE_LABELS[paper.source] ?? paper.source;

    return (
        <div className="group glass rounded-xl p-4 hover:bg-white/5 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${index * 60}ms` }}>
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                        {sourceLabel}
                    </span>
                    {paper.year && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {paper.year}
                        </span>
                    )}
                    {paper.citations !== undefined && paper.citations !== null && (
                        <span className="text-[11px] text-slate-500">
                            {paper.citations.toLocaleString()} citations
                        </span>
                    )}
                </div>
                {paper.url && (
                    <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-brand-400 flex-shrink-0"
                        title="Open paper"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>

            <h4 className="text-sm font-medium text-slate-200 leading-snug mb-2 group-hover:text-white transition-colors">
                {paper.title}
            </h4>

            {paper.authors && paper.authors.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                    <Users className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <span className="text-[11px] text-slate-500 truncate">
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                    </span>
                </div>
            )}

            {paper.abstract && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex gap-1">
                    <Quote className="w-3 h-3 text-slate-700 flex-shrink-0 mt-0.5" />
                    {paper.abstract.slice(0, 220)}{paper.abstract.length > 220 ? '…' : ''}
                </p>
            )}
        </div>
    );
}

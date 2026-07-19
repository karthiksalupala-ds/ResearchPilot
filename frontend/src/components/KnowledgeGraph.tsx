import { useEffect, useRef, useState } from 'react';
import type { ResearchPaper } from '../lib/types';
import { Share2, Link as LinkIcon, Database } from 'lucide-react';

interface Node {
    id: string;
    title: string;
    source: string;
    type: 'paper' | 'query';
    x?: number;
    y?: number;
}

interface Link {
    source: string;
    target: string;
}

interface KnowledgeGraphProps {
    papers: ResearchPaper[];
    query: string;
}

export default function KnowledgeGraph({ papers, query }: KnowledgeGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

    // Dynamic generation of mock links based on shared keywords in titles/abstracts
    const generateLinks = (nodes: Node[]): Link[] => {
        const links: Link[] = [];
        const queryNode = nodes.find(n => n.type === 'query');

        nodes.forEach(node => {
            if (node.type === 'paper' && queryNode) {
                links.push({ source: queryNode.id, target: node.id });
            }
        });

        // Similarity links between papers
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].type === 'paper' && nodes[j].type === 'paper') {
                    // Simple title-based similarity mock
                    const commonWords = nodes[i].title.split(' ').filter(w =>
                        w.length > 4 && nodes[j].title.includes(w)
                    );
                    if (commonWords.length > 0) {
                        links.push({ source: nodes[i].id, target: nodes[j].id });
                    }
                }
            }
        }
        return links;
    };

    useEffect(() => {
        if (!svgRef.current) return;

        const width = svgRef.current.clientWidth;
        const height = 400;

        const nodes: Node[] = [
            { id: 'query', title: query, source: 'user', type: 'query' },
            ...papers.map((p, i) => ({
                id: `paper-${i}`,
                title: p.title,
                source: p.source,
                type: 'paper' as const
            }))
        ];

        const links = generateLinks(nodes);

        // Simple manual physics simulation (to avoid adding d3 dependency if not needed)
        // However, for a "WOW" effect, d3-force is best. I'll assume standard d3 is okay or use a simplified mock
        // Let's use a simple circular layout with some randomized offset for now to ensure it works without D3

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 140;

        nodes.forEach((node, i) => {
            if (node.id === 'query') {
                node.x = centerX;
                node.y = centerY;
            } else {
                const angle = (i / (nodes.length - 1)) * 2 * Math.PI;
                node.x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
                node.y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
            }
        });

    }, [papers, query]);

    return (
        <div className="relative glass rounded-2xl p-6 border border-white/10 overflow-hidden h-[450px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-brand-400">
                    <Share2 className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Semantic Map</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Query</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Papers</span>
                    </div>
                </div>
            </div>

            <svg ref={svgRef} className="w-full h-[380px] cursor-grab active:cursor-grabbing">
                {/* Background Grid */}
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.03" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Connections (Mocked) */}
                {papers.map((_, i) => (
                    <line
                        key={i}
                        x1="50%" y1="50%"
                        x2={`${50 + Math.cos((i / papers.length) * 2 * Math.PI) * 35}%`}
                        y2={`${50 + Math.sin((i / papers.length) * 2 * Math.PI) * 35}%`}
                        stroke="rgba(99, 102, 241, 0.2)"
                        strokeWidth="1"
                        className="animate-pulse"
                    />
                ))}

                {/* Central Node */}
                <circle
                    cx="50%" cy="50%" r="8"
                    className="fill-brand-500 animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' }}
                />

                {/* Paper Nodes */}
                {papers.map((p, i) => {
                    const angle = (i / papers.length) * 2 * Math.PI;
                    const x = 50 + Math.cos(angle) * 35;
                    const y = 50 + Math.sin(angle) * 35;
                    return (
                        <g
                            key={i}
                            className="group cursor-pointer"
                            onMouseEnter={() => setHoveredNode({ id: `p-${i}`, title: p.title, source: p.source, type: 'paper' })}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            <circle
                                cx={`${x}%`} cy={`${y}%`} r="6"
                                className="fill-purple-500/40 stroke-purple-400 group-hover:fill-brand-400 group-hover:r-8 transition-all duration-300"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredNode && (
                <div className="absolute bottom-6 left-6 right-6 p-4 glass-bright border border-brand-500/20 rounded-xl animate-slide-up pointer-events-none">
                    <div className="flex items-center gap-2 mb-1">
                        <Database className="w-3.5 h-3.5 text-brand-400" />
                        <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{hoveredNode.source}</span>
                    </div>
                    <p className="text-xs text-white font-medium leading-tight">{hoveredNode.title}</p>
                </div>
            )}
        </div>
    );
}

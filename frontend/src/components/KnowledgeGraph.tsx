import { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Network, ExternalLink, User, Calendar, BookOpen } from 'lucide-react';
import type { AnalysisResult, ResearchPaper } from '../lib/types';

interface KnowledgeGraphProps {
    result: AnalysisResult | null;
}

interface Node {
    id: string;
    label: string;
    paper: ResearchPaper;
    x: number;
    y: number;
    color: string;
}

interface Link {
    source: string;
    target: string;
}

export default function KnowledgeGraph({ result }: KnowledgeGraphProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);

    useEffect(() => {
        if (!result || !result.papers || result.papers.length === 0) return;

        // Position nodes in a radial layout around the center (300, 200)
        const centerX = 350;
        const centerY = 200;
        const radius = 130;

        const newNodes: Node[] = result.papers.map((paper, idx) => {
            const angle = (idx / result.papers.length) * 2 * Math.PI;
            
            // Set node color based on academic source
            let color = 'fill-indigo-400 stroke-indigo-300';
            if (paper.source?.toLowerCase().includes('arxiv')) {
                color = 'fill-purple-400 stroke-purple-300';
            } else if (paper.source?.toLowerCase().includes('pubmed')) {
                color = 'fill-teal-400 stroke-teal-300';
            } else if (paper.source?.toLowerCase().includes('scholar')) {
                color = 'fill-emerald-400 stroke-emerald-300';
            }

            return {
                id: `node-${idx}`,
                label: paper.title,
                paper,
                x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
                y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
                color
            };
        });

        // Create links from center to all nodes, plus some cross-connections
        const newLinks: Link[] = newNodes.map(node => ({
            source: 'center',
            target: node.id
        }));

        // Add some cross links between papers of the same year or source to show citation network
        for (let i = 0; i < newNodes.length; i++) {
            for (let j = i + 1; j < newNodes.length; j++) {
                if (
                    newNodes[i].paper.source === newNodes[j].paper.source ||
                    newNodes[i].paper.year === newNodes[j].paper.year
                ) {
                    newLinks.push({
                        source: newNodes[i].id,
                        target: newNodes[j].id
                    });
                    break; // limit to one cross link per node to keep it clean
                }
            }
        }

        setNodes(newNodes);
        setLinks(newLinks);
        if (result.papers[0]) {
            setSelectedPaper(result.papers[0]);
        }
    }, [result]);

    if (!result || nodes.length === 0) return null;

    // Center coordinates
    const centerX = 350;
    const centerY = 200;

    return (
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-fade-in max-w-5xl mx-auto mb-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                    <Network className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Interactive Research Citation Map</h3>
                    <p className="text-xs text-slate-400">Drag nodes to explore relations and citation clusters</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                
                {/* SVG Graph Canvas (Left / 2 cols) */}
                <div className="lg:col-span-2 relative bg-black/40 border border-white/5 rounded-2xl overflow-hidden min-h-[380px] flex items-center justify-center">
                    <div className="absolute top-4 left-4 z-10 flex gap-4 text-[10px] uppercase font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> arXiv</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> PubMed</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Semantic Scholar</span>
                    </div>

                    <svg className="w-full h-[400px]" viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
                        {/* Connecting Links */}
                        {links.map((link, idx) => {
                            const sourceNode = link.source === 'center' ? { x: centerX, y: centerY } : nodes.find(n => n.id === link.source);
                            const targetNode = nodes.find(n => n.id === link.target);

                            if (!sourceNode || !targetNode) return null;

                            return (
                                <line
                                    key={`link-${idx}`}
                                    x1={sourceNode.x}
                                    y1={sourceNode.y}
                                    x2={targetNode.x}
                                    y2={targetNode.y}
                                    className="stroke-indigo-500/20 stroke-[1.5]"
                                />
                            );
                        })}

                        {/* Center Hub Node */}
                        <g>
                            <circle
                                cx={centerX}
                                cy={centerY}
                                r="16"
                                className="fill-brand-500 stroke-brand-300 stroke-2 shadow-lg animate-pulse"
                            />
                            <circle
                                cx={centerX}
                                cy={centerY}
                                r="26"
                                className="fill-transparent stroke-brand-500/20 stroke-1 animate-ping"
                            />
                        </g>

                        {/* Paper Nodes */}
                        {nodes.map((node) => (
                            <motion.g
                                key={node.id}
                                drag
                                dragMomentum={false}
                                dragElastic={0.1}
                                onDrag={(event, info) => {
                                    // Update visual position of coordinates
                                    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y } : n));
                                }}
                                onClick={() => setSelectedPaper(node.paper)}
                                className="cursor-pointer group"
                            >
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r="10"
                                    className={`${node.color} stroke-2 transition-all group-hover:scale-125`}
                                />
                                <text
                                    x={node.x}
                                    y={node.y - 15}
                                    textAnchor="middle"
                                    className="fill-slate-400 font-bold text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                >
                                    {node.paper.title.slice(0, 30)}...
                                </text>
                            </motion.g>
                        ))}
                    </svg>
                </div>

                {/* Selected Paper Details Card (Right / 1 col) */}
                <div className="lg:col-span-1 flex flex-col justify-between">
                    {selectedPaper ? (
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-lg flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                    {selectedPaper.source}
                                </span>
                                <h4 className="text-sm font-bold text-white leading-snug">{selectedPaper.title}</h4>
                                
                                <div className="space-y-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                        <span className="truncate">{selectedPaper.authors?.join(', ') || 'Unknown Author'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                        <span>Published: {selectedPaper.year || 'N/A'}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-4 line-clamp-6">
                                    {selectedPaper.abstract}
                                </p>
                            </div>

                            {selectedPaper.url && (
                                <a
                                    href={selectedPaper.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-xs font-semibold text-white hover:bg-white/5 transition-all"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Read Source Paper
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="p-5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs text-slate-500 italic h-full">
                            Select a paper node to view citation data
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

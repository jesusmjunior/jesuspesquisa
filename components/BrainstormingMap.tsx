
import React from 'react';
import { BrainstormingData, BrainstormingNode, SearchResult } from '../types';
import { BookIcon } from './Icons';

const NodeTooltip: React.FC<{ sources: SearchResult[] }> = ({ sources }) => {
    if (sources.length === 0) return null;
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 p-2 bg-stone-800 border border-stone-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <p className="text-xs font-bold text-stone-200 mb-1">Fontes:</p>
            <ul className="text-xs text-stone-400 list-none p-0">
                {sources.map((source, i) => (
                    <li key={i} className="truncate">
                        - {source.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SubNode: React.FC<{ node: BrainstormingNode; results: SearchResult[] }> = ({ node, results }) => {
    const relevantSources = node.sourceIndices.map(i => results[i]).filter(Boolean);
    return (
        <div className="relative group pl-8">
            {/* Vertical connector from parent */}
            <div className="map-connector top-0 left-4 w-px h-full border-l" />
            {/* Horizontal connector to node */}
            <div className="map-connector top-8 left-4 w-4 h-px border-t" />

            <div className="relative ml-4 flex flex-col items-start">
                <div className="w-full bg-stone-700/50 border border-stone-600 rounded-lg p-3 mt-4 hover:border-sky-500 transition-colors">
                    <h5 className="font-semibold text-sky-300">{node.idea}</h5>
                    <p className="text-sm text-stone-400 mt-1">{node.details}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {relevantSources.map((source, i) => (
                           <span key={i} className="text-xs bg-sky-900/70 text-sky-300 px-2 py-0.5 rounded-full" title={source.title}>
                               Fonte {node.sourceIndices[i] + 1}
                           </span>
                        ))}
                    </div>
                </div>
                <NodeTooltip sources={relevantSources} />
            </div>
        </div>
    );
};

const MainIdeaNode: React.FC<{ node: BrainstormingNode; results: SearchResult[] }> = ({ node, results }) => {
    const relevantSources = node.sourceIndices.map(i => results[i]).filter(Boolean);
    return (
        <div className="relative group flex-1 min-w-[300px]">
             {/* Horizontal connector from center */}
            <div className="map-connector top-12 left-0 w-1/2 h-px border-t" />
            <div className="map-connector top-12 right-0 w-1/2 h-px border-t" />
            {/* Vertical connector down to children */}
            {node.subNodes && node.subNodes.length > 0 && (
              <div className="map-connector top-12 left-1/2 w-px h-full border-l" />
            )}

            <div className="relative z-10 flex flex-col items-center">
                 <div className="bg-amber-800/80 border-2 border-amber-600 rounded-lg p-4 text-center shadow-lg w-full max-w-sm hover:scale-105 transition-transform">
                    <h4 className="text-lg font-bold text-white">{node.idea}</h4>
                    <p className="text-sm text-amber-100/90 mt-1">{node.details}</p>
                </div>
                <NodeTooltip sources={relevantSources} />
                
                {/* Vertical connector from node to sub-node line */}
                {node.subNodes && node.subNodes.length > 0 && (
                     <div className="map-connector top-full left-1/2 w-px h-8 border-l" />
                )}
            </div>

            {node.subNodes && node.subNodes.length > 0 && (
                <div className="relative mt-8 pt-8">
                    {/* Horizontal line for sub-nodes */}
                    <div className="map-connector top-8 left-4 right-4 h-px border-t" />
                    <div className="flex flex-col gap-4">
                        {node.subNodes.map((subNode, index) => (
                            <SubNode key={index} node={subNode} results={results} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const BrainstormingMap: React.FC<{ data: BrainstormingData; results: SearchResult[] }> = ({ data, results }) => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-amber-200/90 mb-6 text-center">Mapa de Brainstorming da IA</h2>
            <div className="p-6 bg-stone-900/40 border border-stone-700/60 rounded-lg shadow-lg">
                <div className="flex justify-center mb-12">
                     <div className="relative text-center p-6 bg-indigo-900/80 border-2 border-indigo-600 rounded-xl shadow-2xl">
                        <h3 className="text-2xl font-bold text-white">{data.centralTheme}</h3>
                        <p className="text-indigo-200">Tema Central</p>
                        {/* Vertical connector from central theme */}
                        <div className="map-connector top-full left-1/2 w-px h-12 border-l" />
                    </div>
                </div>
                <div className="relative flex flex-col md:flex-row gap-x-8 gap-y-16 items-start justify-center pt-12">
                    {/* Horizontal line connecting main ideas */}
                    <div className="map-connector top-12 left-8 right-8 h-px border-t" />
                    {data.mainIdeas.map((idea, index) => (
                        <MainIdeaNode key={index} node={idea} results={results} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrainstormingMap;

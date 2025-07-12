
import React from 'react';
import { SearchSession } from '../types';
import { HistoryIcon, ExportIcon, TrashIcon, LoadIcon } from './Icons';

interface HistoryPaneProps {
  searches: SearchSession[];
  onLoad: (session: SearchSession) => void;
  onDelete: (timestamp: number) => void;
  onExportAll: () => void;
}

const HistoryPane: React.FC<HistoryPaneProps> = ({ searches, onLoad, onDelete, onExportAll }) => {
  if (searches.length === 0) {
    return (
        <p className="mt-8 text-stone-500 italic">Nenhuma pesquisa recente encontrada.</p>
    );
  }

  return (
    <div className="mt-12 w-full animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300">
                    <HistoryIcon className="w-6 h-6"/>
                    Histórico de Pesquisa
                </h3>
                <button
                    onClick={onExportAll}
                    className="flex items-center gap-2 bg-sky-800/80 text-sky-200 font-medium px-4 py-2 rounded-md hover:bg-sky-700/80 transition-colors disabled:opacity-50 text-sm"
                >
                    <ExportIcon className="w-4 h-4"/>
                    <span>Exportar Tudo</span>
                </button>
            </div>
            <div className="bg-stone-900/40 border border-stone-700/60 rounded-lg shadow-lg overflow-hidden">
                <ul className="divide-y divide-stone-700/60">
                    {searches.map((session) => (
                        <li key={session.timestamp} className="p-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors group">
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-stone-200 truncate" title={session.query}>
                                    {session.query}
                                </p>
                                <p className="text-sm text-stone-400 mt-1">
                                    {new Date(session.timestamp).toLocaleString('pt-BR')} - {session.results.length} resultado(s)
                                </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                    onClick={() => onLoad(session)}
                                    title="Carregar esta pesquisa"
                                    className="p-2 text-stone-300 hover:text-amber-400 bg-stone-700 rounded-full hover:bg-stone-600"
                                >
                                    <LoadIcon className="w-5 h-5" />
                               </button>
                               <button 
                                    onClick={() => onDelete(session.timestamp)}
                                    title="Excluir esta pesquisa"
                                    className="p-2 text-stone-300 hover:text-red-500 bg-stone-700 rounded-full hover:bg-stone-600"
                                >
                                    <TrashIcon className="w-5 h-5" />
                               </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  );
};

export default HistoryPane;

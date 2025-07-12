
import React from 'react';
import { NewSearchIcon, ExportIcon, EditIcon, CheckIcon } from './Icons';

interface PostSearchActionsProps {
  onNewSearch: () => void;
  onExport: () => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
  onGenerateArticle: () => void;
  selectedCount: number;
}

const PostSearchActions: React.FC<PostSearchActionsProps> = ({ 
    onNewSearch, 
    onExport, 
    selectionMode, 
    onToggleSelection, 
    onGenerateArticle, 
    selectedCount
}) => {
    return (
        <div className="my-6 py-3 flex flex-wrap items-center justify-center gap-4">
            <button
                onClick={onNewSearch}
                className="flex items-center gap-2 bg-stone-700/80 text-stone-200 font-medium px-4 py-2 rounded-md hover:bg-stone-600/80 transition-colors"
            >
                <NewSearchIcon className="w-5 h-5"/>
                <span>Nova Pesquisa</span>
            </button>
            <button
                onClick={onToggleSelection}
                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-md transition-colors ${
                    selectionMode ? 'bg-red-800/80 text-red-200 hover:bg-red-700/80' : 'bg-indigo-700/80 text-indigo-200 hover:bg-indigo-600/80'
                }`}
            >
                <EditIcon className="w-5 h-5"/>
                <span>{selectionMode ? 'Cancelar Seleção' : 'Selecionar Obras para Artigo'}</span>
            </button>
            
            {selectionMode && (
                 <button
                    onClick={onGenerateArticle}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 bg-emerald-700/80 text-emerald-100 font-bold px-4 py-2 rounded-md hover:bg-emerald-600/80 transition-colors disabled:bg-stone-700 disabled:cursor-not-allowed"
                >
                    <CheckIcon className="w-5 h-5"/>
                    <span>Gerar Artigo Científico ({selectedCount} selecionada{selectedCount !== 1 ? 's' : ''})</span>
                </button>
            )}

             <button
                onClick={onExport}
                className="flex items-center gap-2 bg-sky-800/80 text-sky-200 font-medium px-4 py-2 rounded-md hover:bg-sky-700/80 transition-colors"
            >
                <ExportIcon className="w-5 h-5"/>
                <span>Exportar Pesquisa Atual</span>
            </button>
        </div>
    );
};

export default PostSearchActions;

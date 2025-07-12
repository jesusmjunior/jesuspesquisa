
import React, { useState, useCallback } from 'react';
import { SearchResult, BrainstormingData } from '../types';
import { translateText } from '../services/geminiService';
import ResultCard from './ResultCard';
import BrainstormingMap from './BrainstormingMap';
import AnalysisInput from './AnalysisInput';
import Loader from './Loader';

interface ResultsDisplayProps {
  summary: string;
  results: SearchResult[];
  brainstormingData: BrainstormingData | null;
  selectionMode: boolean;
  isAnalysisLoading: boolean;
  onSelectResult: (result: SearchResult) => void;
  onOpenInBrowser: (result: SearchResult) => void;
  onStartBrainstorming: (theme: string) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
    summary, 
    results, 
    brainstormingData, 
    selectionMode, 
    isAnalysisLoading,
    onSelectResult, 
    onOpenInBrowser,
    onStartBrainstorming,
}) => {
  const [displayedSummary, setDisplayedSummary] = useState(summary);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = useCallback(async () => {
    setIsTranslating(true);
    try {
      if (isTranslated) {
        setDisplayedSummary(summary);
        setIsTranslated(false);
      } else {
        const translated = await translateText(summary, 'English');
        setDisplayedSummary(translated);
        setIsTranslated(true);
      }
    } catch (error) {
      console.error(error);
      // Optionally show an error to the user
    } finally {
      setIsTranslating(false);
    }
  }, [isTranslated, summary]);
  
  return (
    <div className="mt-8 animate-fade-in">
      {/* AI Summary Section */}
      <div className="mb-12 p-6 bg-stone-900/40 border border-stone-700/60 rounded-lg shadow-lg relative">
        <h2 className="text-xl font-bold text-amber-200/90 mb-3">Resumo da IA</h2>
        <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">{displayedSummary}</p>
        <div className="absolute top-4 right-4">
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="px-3 py-1 bg-stone-700/80 text-xs font-semibold text-stone-300 rounded-full hover:bg-stone-600/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isTranslating ? 'Traduzindo...' : (isTranslated ? 'Mostrar Original' : 'Traduzir para Inglês')}
          </button>
        </div>
      </div>

      {/* Bookshelf Section */}
      {results.length > 0 && (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-amber-200/90 mb-6 text-center">Documentos Fonte</h2>
            <div className="p-8 sm:p-12 rounded-lg bookshelf-bg">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-8 gap-y-12">
                    {results.map((result, index) => (
                        <ResultCard 
                            key={result.url + index} 
                            result={result} 
                            selectionMode={selectionMode}
                            onSelect={() => onSelectResult(result)}
                            onOpenInBrowser={() => onOpenInBrowser(result)}
                        />
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Brainstorming Analysis Section */}
      {results.length > 0 && (
        <div className="mt-12">
            {!brainstormingData && !isAnalysisLoading && (
                <AnalysisInput onStartAnalysis={onStartBrainstorming} isLoading={isAnalysisLoading} />
            )}
            {isAnalysisLoading && <Loader message="Realizando análise de brainstorming..." />}
            {brainstormingData && <BrainstormingMap data={brainstormingData} results={results} />}
        </div>
      )}
      

       {results.length === 0 && summary && (
         <div className="text-center mt-12 p-8 rounded-lg bookshelf-bg">
            <h2 className="text-2xl font-bold text-stone-200">Nenhuma fonte encontrada.</h2>
            <p className="text-stone-400 mt-2 max-w-2xl mx-auto">
              O resumo da IA foi gerado, mas nenhum documento fonte específico pôde ser recuperado para esta consulta.
            </p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
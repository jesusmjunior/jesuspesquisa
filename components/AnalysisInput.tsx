
import React, { useState } from 'react';

interface AnalysisInputProps {
  onStartAnalysis: (theme: string) => void;
  isLoading: boolean;
}

const AnalysisInput: React.FC<AnalysisInputProps> = ({ onStartAnalysis, isLoading }) => {
  const [theme, setTheme] = useState('');

  const handleStart = () => {
    if (theme.trim() && !isLoading) {
      onStartAnalysis(theme.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="animate-fade-in p-6 bg-stone-900/40 border border-dashed border-stone-600 rounded-lg shadow-lg text-center max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-amber-200/90 mb-3">Próximo Passo: Análise Profunda</h2>
      <p className="text-stone-400 mb-4">
        Defina um tema central para o AI realizar um brainstorming e mapear as conexões entre as fontes.
      </p>
      <div className="flex items-center gap-3 w-full">
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: 'Impacto da IA na educação' ou 'Técnicas de...'"
          disabled={isLoading}
          className="w-full p-3 pl-4 bg-stone-800/70 border border-stone-700 rounded-md focus:ring-2 focus:ring-amber-400/50 focus:border-amber-500/80 outline-none transition-all placeholder-stone-500 disabled:opacity-50"
          aria-label="Central theme for brainstorming analysis"
        />
        <button
          onClick={handleStart}
          disabled={isLoading || !theme.trim()}
          className="flex-shrink-0 bg-amber-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-amber-700 transition-colors disabled:bg-stone-700 disabled:cursor-not-allowed"
          aria-label="Start brainstorming analysis"
        >
          <span>Analisar</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisInput;

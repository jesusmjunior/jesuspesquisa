
import React from 'react';
import { SearchIcon } from './Icons';

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (query: string) => void;
  disabled: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ query, setQuery, onSearch, disabled }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !disabled) {
      onSearch(query);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative w-full">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descubra conhecimento, faça uma pergunta..."
          disabled={disabled}
          className="w-full p-3 pl-12 bg-stone-900/50 border border-stone-700 rounded-full focus:ring-2 focus:ring-amber-400/50 focus:border-amber-500/80 outline-none transition-all placeholder-stone-500 disabled:opacity-50"
          aria-label="Search query input"
        />
      </div>
      <button
        onClick={() => onSearch(query)}
        disabled={disabled}
        className="flex-shrink-0 bg-amber-800 text-white font-semibold px-6 py-3 rounded-full hover:bg-amber-700 transition-colors disabled:bg-stone-700 disabled:cursor-not-allowed"
        aria-label="Submit search"
      >
        <span>Pesquisar</span>
      </button>
    </div>
  );
};

export default SearchInput;

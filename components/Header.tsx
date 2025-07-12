
import React from 'react';
import { BookIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="text-center border-b border-stone-700/50 pb-6">
      <div className="flex items-center justify-center gap-4">
        <BookIcon className="w-9 h-9 text-amber-200/80" />
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-200 tracking-wider">
          J.J. I.A. Obras Literárias e Artigos
        </h1>
      </div>
      <p className="mt-3 text-stone-400 max-w-3xl mx-auto italic">
        Um assistente de IA para pesquisa e descoberta de conhecimento.
      </p>
    </header>
  );
};

export default Header;
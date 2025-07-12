import React, { useEffect, useState } from 'react';
import { translateText, generateComicImage, generateNewspaperSnippets, generateComicStripPanels } from '../services/geminiService';
import { NewspaperSnippet, ComicPanel } from '../types';
import Loader from './Loader';
import { FullscreenIcon, CloseIcon } from './Icons';

interface BrowserViewProps {
  content: {
    url: string;
    title: string;
    contentHtml?: string;
  };
  onBackToSearch: () => void;
}

const NewspaperLoader: React.FC<{text: string}> = ({text}) => (
    <div className="flex flex-col items-center justify-center p-4 bg-black/10 rounded-md">
        <svg className="w-8 h-8 animate-spin text-stone-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      <p className="text-stone-700 mt-2 text-xs text-center italic">{text}</p>
    </div>
)

const BrowserView: React.FC<BrowserViewProps> = ({ content, onBackToSearch }) => {
  const [displayHtml, setDisplayHtml] = useState(content.contentHtml || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [comicImageUrl, setComicImageUrl] = useState<string | null>(null);
  const [comicPanels, setComicPanels] = useState<ComicPanel[] | null>(null);
  const [snippets, setSnippets] = useState<NewspaperSnippet[] | null>(null);
  const [isLoadingExtras, setIsLoadingExtras] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [isComicFullscreen, setIsComicFullscreen] = useState(false);

  useEffect(() => {
    const locale = 'pt-BR';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString(locale, options));

    const fetchExtras = async () => {
      if (!content.contentHtml) {
        setIsLoadingExtras(false);
        return;
      }
      setIsLoadingExtras(true);
      try {
        const [comicImg, comicPanelData, snippetsData] = await Promise.all([
          generateComicImage(content.title),
          generateComicStripPanels(content.title),
          generateNewspaperSnippets(content.contentHtml, content.title)
        ]);
        setComicImageUrl(comicImg);
        setComicPanels(comicPanelData);
        setSnippets(snippetsData);
      } catch (error) {
        console.error("Failed to fetch newspaper extras:", error);
      } finally {
        setIsLoadingExtras(false);
      }
    };
    
    fetchExtras();
  }, [content.contentHtml, content.title]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if(isComicFullscreen) {
            setIsComicFullscreen(false);
        } else {
            onBackToSearch();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToSearch, isComicFullscreen]);

  const handleTranslate = async () => {
    // This is a simplified translation and doesn't handle re-translation of extras.
    if (!content.contentHtml) return;
    setIsTranslating(true);
    try {
      const translation = await translateText(displayHtml, 'English');
      setDisplayHtml(translation);
    } catch (error) {
      console.error("Translation failed", error);
      alert("A tradução falhou.");
    } finally {
      setIsTranslating(false);
    }
  };


  return (
    <div className="animate-fade-in max-w-7xl mx-auto font-serif">
       <style>{`
          .newspaper-columns {
            column-count: 3;
            column-gap: 40px;
            column-rule: 1px solid #00000020;
          }
          @media (max-width: 1024px) {
            .newspaper-columns { column-count: 2; }
          }
           @media (max-width: 640px) {
            .newspaper-columns { column-count: 1; }
          }

          .newspaper-main-content h1, .newspaper-main-content h2, .newspaper-main-content h3 {
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            color: #1a1a1a;
            break-after: avoid;
            margin-top: 1.5em;
          }
          .newspaper-main-content p {
            text-align: justify;
            hyphens: auto;
            margin-bottom: 1em;
            line-height: 1.6;
          }
          .newspaper-main-content a {
             color: #0d4b6b;
             text-decoration: none;
          }
          .newspaper-main-content a:hover {
             text-decoration: underline;
          }
          
          .newspaper-main-content > p:first-of-type::first-letter {
            color: #333;
            float: left;
            font-family: 'Playfair Display', serif;
            font-size: 4.5rem;
            line-height: 0.8;
            padding-top: 0.5rem;
            padding-right: 0.5rem;
            font-weight: 700;
          }

          .newspaper-main-content blockquote {
             border: none;
             background-color: #f3f4f6;
             padding: 1.5rem;
             margin: 1.5rem 0;
             font-style: italic;
             font-size: 1.125rem;
             color: #374151;
             position: relative;
             text-indent: 0;
             break-inside: avoid;
             border-left: 4px solid #d1d5db;
          }
          .newspaper-main-content blockquote::before {
             content: '“';
             font-family: 'Playfair Display', serif;
             font-size: 4rem;
             color: #e5e7eb;
             position: absolute;
             left: 0.5rem;
             top: -0.5rem;
             line-height: 1;
             z-index: 0;
          }
          .newspaper-main-content blockquote p {
              margin: 0;
              text-indent: 0;
              position: relative;
              z-index: 1;
          }
       `}</style>

        <div className="bg-[#fdfdf5] text-black p-4 sm:p-6 md:p-8 rounded-sm shadow-2xl border-t-2 border-b-8 border-x-2 border-stone-300">
           {/* Masthead */}
           <header className="text-center border-b-4 border-b-black pb-4 mb-4">
              <h1 className="text-5xl md:text-7xl font-black" style={{fontFamily: "'Playfair Display', serif"}}>NEWS JESUS I.A</h1>
              <div className="flex justify-between items-center text-sm text-stone-700 mt-2 border-y border-stone-400 py-1">
                 <button onClick={onBackToSearch} className="font-sans hover:underline">&larr; Voltar à Pesquisa</button>
                 <p className="font-sans font-bold uppercase tracking-wider">{currentDate}</p>
                 <button onClick={handleTranslate} disabled={isTranslating} className="font-sans hover:underline">{isTranslating ? 'Traduzindo...' : 'Translate to English'}</button>
              </div>
           </header>
          
           {!content.contentHtml ? (
              <div className="p-12 text-center text-red-800 bg-red-50 border border-red-200 rounded-md">
                  <h2 className="text-2xl font-bold">Falha na Extração de Conteúdo</h2>
                  <p className="mt-4 font-sans">A IA não conseguiu extrair o conteúdo desta página para o modo jornal.</p>
                   <a href={content.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-semibold rounded-md transition-colors">
                      Abrir em Nova Aba
                  </a>
              </div>
           ) : (
             <div className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <main className="col-span-12 lg:col-span-9">
                    <h1 className="text-3xl lg:text-5xl font-extrabold !text-black mb-2 leading-tight" style={{fontFamily: "'Playfair Display', serif"}}>{content.title}</h1>
                    <p className="text-stone-600 mb-6 font-sans border-b border-stone-300 pb-4">
                       Fonte Original: <a href={content.url} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-800 hover:text-cyan-600 transition-colors">{content.url}</a>
                    </p>
                    <div className="newspaper-columns newspaper-main-content" dangerouslySetInnerHTML={{ __html: displayHtml }} />
                </main>

                {/* Sidebar */}
                <aside className="col-span-12 lg:col-span-3 lg:border-l-2 border-stone-300/70 lg:pl-6">
                   <div className="sticky top-6 flex flex-col gap-6">
                       
                       {/* Comic Section */}
                       <div>
                           <h2 className="text-xl font-bold border-b-2 border-black pb-1 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>A Charge do Dia</h2>
                           {isLoadingExtras ? (
                                <NewspaperLoader text="Desenhando a charge..."/>
                            ) : comicImageUrl ? (
                                <div className="relative group">
                                    <img src={comicImageUrl} alt="AI generated comic strip" className="w-full border-2 border-black p-1"/>
                                    
                                    {comicPanels && comicPanels.length === 3 && (
                                        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                                            {comicPanels.map((panel, index) => (
                                                <div key={index} className="flex items-end justify-center p-2">
                                                    <p className="bg-white/80 backdrop-blur-sm text-black font-semibold text-[10px] text-center rounded-md p-1.5 shadow-md font-sans">
                                                        "{panel.dialogue}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setIsComicFullscreen(true)}
                                        className="absolute top-1.5 right-1.5 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                        title="Ver em tela cheia"
                                        aria-label="Ver charge em tela cheia"
                                    >
                                        <FullscreenIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-stone-600 font-sans">A charge não pôde ser desenhada.</p>
                            )}
                       </div>

                       {/* Snippets Section */}
                       <div>
                           <h2 className="text-xl font-bold border-b-2 border-black pb-1 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>Notícias em Resumo</h2>
                           {isLoadingExtras ? <NewspaperLoader text="Apurando as notícias..."/> :
                            snippets && snippets.length > 0 ? (
                               <ul className="space-y-4">
                                   {snippets.map((snippet, index) => (
                                       <li key={index} className="border-b border-stone-300/70 pb-2">
                                           <h3 className="font-bold text-stone-900">{snippet.headline}</h3>
                                           <p className="text-sm text-stone-700 font-sans">{snippet.text}</p>
                                       </li>
                                   ))}
                               </ul>
                           ) : <p className="text-sm text-stone-600 font-sans">Nenhum resumo disponível.</p>}
                       </div>

                   </div>
                </aside>
            </div>
           )}
        </div>
        {isComicFullscreen && comicImageUrl && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsComicFullscreen(false)}>
                <button 
                    onClick={() => setIsComicFullscreen(false)} 
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 rounded-full p-2 text-white z-50 transition-colors"
                    aria-label="Fechar tela cheia"
                >
                    <CloseIcon className="w-7 h-7" />
                </button>
                <div className="relative w-full max-w-6xl" onClick={e => e.stopPropagation()}>
                    <img src={comicImageUrl} alt="AI generated comic strip in fullscreen" className="w-full h-auto object-contain max-h-[90vh] rounded"/>
                    {comicPanels && comicPanels.length === 3 && (
                        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                            {comicPanels.map((panel, index) => (
                                <div key={index} className="flex items-end justify-center p-4">
                                    <p className="bg-white/80 backdrop-blur-sm text-black font-semibold text-sm md:text-base text-center rounded-md p-2 shadow-lg font-sans">
                                        "{panel.dialogue}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default BrowserView;
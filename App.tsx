
import React, { useState, useEffect } from 'react';
import { SearchResult, AppStatus, SearchSession, AppView, BrainstormingData } from './types';
import { generateGroundedResponse, processSourcesAndExtractContent, generateBrainstormingMap, generateScientificArticle, generateCoverImage, processSingleSource } from './services/geminiService';
import { getRecentSearches, saveSearch, exportSearches, deleteSearchByTimestamp, exportArticleAsHtml } from './services/storageService';

import Header from './components/Header';
import SearchInput from './components/SearchInput';
import Loader from './components/Loader';
import ResultsDisplay from './components/ResultsDisplay';
import PostSearchActions from './components/ActionButtons';
import { BookIcon } from './components/Icons';
import HistoryPane from './components/HistoryPane';
import ArticleEditor from './components/ArticleEditor';
import BrowserView from './components/HyperfocusBrowser';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [brainstormingData, setBrainstormingData] = useState<BrainstormingData | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchSession[]>([]);

  // New state for workflows
  const [view, setView] = useState<AppView>(AppView.SEARCH);
  const [selectionMode, setSelectionMode] = useState(false);
  const [articleHtml, setArticleHtml] = useState('');
  const [browserContent, setBrowserContent] = useState<{ url: string; title: string; contentHtml?: string; } | null>(null);


  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError("Por favor, insira um tópico para pesquisar.");
      return;
    }
    
    setView(AppView.SEARCH);
    setSelectionMode(false);
    setStatus(AppStatus.LOADING);
    setError(null);
    setResults([]);
    setSummary('');
    setBrainstormingData(null);
    setQuery(searchQuery);

    try {
      setLoadingMessage('Encontrando fontes relevantes...');
      const groundedResponse = await generateGroundedResponse(searchQuery);
      setSummary(groundedResponse.summary);

      if (!groundedResponse.sources || groundedResponse.sources.length === 0) {
        setStatus(AppStatus.SUCCESS);
        const newSession: SearchSession = { query: searchQuery, summary: groundedResponse.summary, results: [], timestamp: Date.now() };
        const updatedSearches = saveSearch(newSession);
        setRecentSearches(updatedSearches);
        return;
      }
      
      setLoadingMessage('Analisando conteúdo e enriquecendo fontes...');
      const processedData = await processSourcesAndExtractContent(groundedResponse.sources, searchQuery);

      const searchResults: SearchResult[] = processedData
        .map((sourceInfo): SearchResult | null => {
            if (sourceInfo.error) {
                console.warn(`Skipping source ${sourceInfo.url} due to processing error: ${sourceInfo.error}`);
                return null;
            }
            return {
                title: sourceInfo.title,
                url: sourceInfo.url,
                coverImageUrl: '', // Initially empty, will be generated
                rating: sourceInfo.rating,
                tags: sourceInfo.tags,
                briefSummary: sourceInfo.briefSummary,
                publicationYear: sourceInfo.publicationYear,
                authors: sourceInfo.authors,
                contentHtml: sourceInfo.contentHtml,
                selected: false,
            };
        })
        .filter((result): result is SearchResult => result !== null);

      setResults(searchResults);
      setStatus(AppStatus.SUCCESS);

      if (searchResults.length === 0 && groundedResponse.sources.length > 0) {
          setError("A IA não conseguiu processar nenhuma das fontes encontradas. Elas podem estar inacessíveis. O resumo acima foi gerado com base em trechos da busca.");
      }
      
      const sessionTimestamp = Date.now();
      
      // Save session with full data for immediate use
      const currentSession: SearchSession = {
        query: searchQuery,
        summary,
        results: searchResults,
        timestamp: sessionTimestamp,
        selectionMode,
      };
      
      const updatedSearchesWithStrippedContent = saveSearch(currentSession);
      setRecentSearches(updatedSearchesWithStrippedContent);
      
      // Asynchronously generate covers and update session
      (async () => {
          let resultsWithCovers = [...searchResults];
          const coverPromises = searchResults.map(result => {
              if (!result.briefSummary) return Promise.resolve(result);
              return generateCoverImage(result.title, result.briefSummary)
                  .then(imageUrl => {
                      const updatedResult = { ...result, coverImageUrl: imageUrl || '' };
                      // Update state to show this one cover immediately
                      setResults(current => current.map(r => r.url === updatedResult.url ? updatedResult : r));
                      return updatedResult;
                  })
                  .catch(err => {
                      console.error(`Failed to generate cover for ${result.title}`, err);
                      return result; // return original on error
                  });
          });

          resultsWithCovers = await Promise.all(coverPromises);

          // Save the final session with all covers (will strip contentHtml again)
          const finalSession: SearchSession = { 
              query: searchQuery, 
              summary: groundedResponse.summary, 
              results: resultsWithCovers, 
              timestamp: sessionTimestamp,
              selectionMode: false,
          };
          const finalSearches = saveSearch(finalSession);
          setRecentSearches(finalSearches);
      })();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`A pesquisa falhou: ${errorMessage}`);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleStartBrainstorming = async (theme: string) => {
    setIsAnalysisLoading(true);
    setError(null);
    try {
        const data = await generateBrainstormingMap(results, theme);
        setBrainstormingData(data);
        
        // Update the current session in storage with the new data
        const currentSession: SearchSession = {
            query, summary, results, brainstormingData: data, timestamp: Date.now(), selectionMode
        };
        const updatedSearches = saveSearch(currentSession);
        setRecentSearches(updatedSearches);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setError(`A análise de brainstorming falhou: ${errorMessage}`);
    } finally {
        setIsAnalysisLoading(false);
    }
  };

  const handleNewSearch = () => {
    setStatus(AppStatus.IDLE);
    setView(AppView.SEARCH);
    setQuery('');
    setResults([]);
    setSummary('');
    setError(null);
    setBrainstormingData(null);
    setSelectionMode(false);
  };
  
  const handleLoadRecent = (session: SearchSession) => {
    setQuery(session.query);
    setSummary(session.summary);
    setResults(session.results.map(r => ({ ...r, selected: r.selected || false, contentHtml: r.contentHtml || undefined })));
    setBrainstormingData(session.brainstormingData || null);
    setSelectionMode(session.selectionMode || false);
    setStatus(AppStatus.SUCCESS);
    setError(null);
    setView(AppView.SEARCH);
  };

  const handleDeleteSearch = (timestamp: number) => {
    const updatedSearches = deleteSearchByTimestamp(timestamp);
    setRecentSearches(updatedSearches);
  };
  
  const handleExportCurrentSearch = () => {
    const currentSession: SearchSession = {
        query,
        summary,
        results,
        brainstormingData: brainstormingData || undefined,
        timestamp: Date.now(),
        selectionMode,
    };
    exportSearches(currentSession);
  };

  const handleToggleSelection = () => {
    const newMode = !selectionMode;
    setSelectionMode(newMode);
    if (!newMode) {
      setResults(prev => prev.map(r => ({ ...r, selected: false })));
    }
  };

  const handleSelectResult = (resultToToggle: SearchResult) => {
    if (!selectionMode) return;
    setResults(prevResults =>
      prevResults.map(r =>
        r.url === resultToToggle.url ? { ...r, selected: !r.selected } : r
      )
    );
  };

  const handleGenerateArticle = async () => {
    const selected = results.filter(r => r.selected);
    if (selected.length === 0) {
      alert("Por favor, selecione pelo menos uma obra para gerar o artigo.");
      return;
    }

    setStatus(AppStatus.LOADING);
    setLoadingMessage('Escrevendo e formatando o artigo científico...');
    setError(null);
    
    try {
        const generatedHtml = await generateScientificArticle(selected, query);
        setArticleHtml(generatedHtml);
        setView(AppView.EDITOR);
        setStatus(AppStatus.SUCCESS); 
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setError(`A geração do artigo falhou: ${errorMessage}`);
        setStatus(AppStatus.ERROR);
    }
  };

  const handleBackToSearch = () => {
    setView(AppView.SEARCH);
    setBrowserContent(null);
    setStatus(AppStatus.SUCCESS);
  };

  const handleExportArticle = () => {
    exportArticleAsHtml(articleHtml, query);
  };

  const handleOpenBrowser = async (result: SearchResult) => {
    if (!result.url || result.url === '#') return;

    // If contentHtml is missing (likely from a session loaded from storage), fetch it on-demand.
    if (!result.contentHtml) {
        setStatus(AppStatus.LOADING);
        setLoadingMessage('Carregando conteúdo do artigo...');
        setError(null);
        try {
            const sourceData = await processSingleSource(result.url, query);
            if (sourceData.error || !sourceData.contentHtml) {
                throw new Error(sourceData.error || "A IA não conseguiu extrair o conteúdo desta página.");
            }
            
            const fetchedContentHtml = sourceData.contentHtml;

            // Cache the fetched content in the component's state
            setResults(prev => prev.map(r => r.url === result.url ? { ...r, contentHtml: fetchedContentHtml } : r));
            
            setBrowserContent({ url: result.url, title: result.title, contentHtml: fetchedContentHtml });
            setView(AppView.BROWSER);
            setStatus(AppStatus.SUCCESS);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao carregar conteúdo: ${errorMessage}`);
            setStatus(AppStatus.ERROR);
        }
    } else {
        // Content already exists, just open the browser
        setBrowserContent({ url: result.url, title: result.title, contentHtml: result.contentHtml });
        setView(AppView.BROWSER);
    }
  };
  
  const selectedCount = results.filter(r => r.selected).length;

  const renderContent = () => {
    switch(view) {
      case AppView.EDITOR:
        return (
          <ArticleEditor 
            articleHtml={articleHtml}
            setArticleHtml={setArticleHtml}
            onBackToSearch={handleBackToSearch}
            onExportArticle={handleExportArticle}
            key={articleHtml}
          />
        );
      
      case AppView.BROWSER:
        return (
          browserContent && <BrowserView content={browserContent} onBackToSearch={handleBackToSearch} />
        );

      case AppView.SEARCH:
      default:
        return (
          <>
            {status !== AppStatus.IDLE && (
              <div className="mb-8">
                  <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} disabled={status === AppStatus.LOADING || isAnalysisLoading} />
              </div>
            )}

            {(status === AppStatus.LOADING) && (
              <Loader message={loadingMessage} />
            )}
            
            {status === AppStatus.IDLE && (
              <div className="text-center">
                  <div className="max-w-2xl mx-auto">
                      <BookIcon className="w-16 h-16 mx-auto text-amber-200/50 mb-4" />
                      <h2 className="text-2xl font-bold text-stone-200">Bem-vindo ao J.J. I.A.</h2>
                      <p className="text-stone-400 mt-2 max-w-2xl mx-auto">
                      Seu assistente de IA para pesquisa de obras e artigos. Insira um tópico para iniciar.
                      </p>
                      <div className="my-8">
                        <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} disabled={false} />
                      </div>
                  </div>
                  <HistoryPane
                      searches={recentSearches}
                      onLoad={handleLoadRecent}
                      onDelete={handleDeleteSearch}
                      onExportAll={() => exportSearches()}
                  />
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="mt-8 text-center bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
                <p className="font-semibold">Ocorreu um erro</p>
                <p className="mt-1">{error}</p>
                <button onClick={handleNewSearch} className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md">Tentar Novamente</button>
              </div>
            )}
            
            {status === AppStatus.SUCCESS && (
              <>
                {error && (
                    <div className="my-4 text-center bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 p-4 rounded-lg max-w-3xl mx-auto">
                        <p className="font-semibold">Aviso</p>
                        <p className="mt-1">{error}</p>
                    </div>
                )}
                <PostSearchActions 
                  onNewSearch={handleNewSearch} 
                  onExport={handleExportCurrentSearch} 
                  selectionMode={selectionMode}
                  onToggleSelection={handleToggleSelection}
                  onGenerateArticle={handleGenerateArticle}
                  selectedCount={selectedCount}
                />
                <ResultsDisplay 
                  summary={summary} 
                  results={results} 
                  brainstormingData={brainstormingData}
                  isAnalysisLoading={isAnalysisLoading}
                  onStartBrainstorming={handleStartBrainstorming}
                  selectionMode={selectionMode}
                  onSelectResult={handleSelectResult}
                  onOpenInBrowser={handleOpenBrowser}
                 />
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8">
          {renderContent()}
        </main>
        <footer className="text-center py-6 mt-12 text-sm text-stone-500 border-t border-stone-800">
          <p>Desenvolvido por Adm. Jesus Martins Oliveira Junior</p>
        </footer>
      </div>
    </div>
  );
};

export default App;


import { SearchSession } from '../types';

const STORAGE_KEY = 'jjia_search_history';
const MAX_SEARCHES = 20; // Keep the last 20 searches

export const getRecentSearches = (): SearchSession[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const searches = JSON.parse(stored) as SearchSession[];
            // Sort by timestamp descending to show the most recent first
            return searches.sort((a, b) => b.timestamp - a.timestamp);
        }
    } catch (error) {
        console.error("Failed to parse search history from localStorage", error);
        localStorage.removeItem(STORAGE_KEY);
    }
    return [];
};

export const saveSearch = (newSession: SearchSession): SearchSession[] => {
    let searches = getRecentSearches();
    
    // Remove potential duplicates by query to avoid clutter, replacing with the newer session
    searches = searches.filter(s => s.query !== newSession.query);

    // Create a copy of the new session, stripping out the large contentHtml to prevent storage overflow.
    const sessionToSave: SearchSession = {
        ...newSession,
        results: newSession.results.map(r => {
            const { contentHtml, ...rest } = r; // Destructure to remove contentHtml
            return rest;
        })
    };

    const updatedSearches = [sessionToSave, ...searches];

    // Enforce the limit
    if (updatedSearches.length > MAX_SEARCHES) {
        updatedSearches.length = MAX_SEARCHES;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
        console.error("Failed to save search history to localStorage", error);
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            alert("Não foi possível salvar a pesquisa. O armazenamento local excedeu a cota. Tente limpar o histórico para liberar espaço.");
        }
    }

    return updatedSearches;
};

export const deleteSearchByTimestamp = (timestamp: number): SearchSession[] => {
    const searches = getRecentSearches();
    const updatedSearches = searches.filter(s => s.timestamp !== timestamp);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
        console.error("Failed to update search history in localStorage after deletion", error);
    }
    return updatedSearches;
};

export const exportSearches = (sessionToExport?: SearchSession): void => {
    try {
        const searches = sessionToExport ? [sessionToExport] : getRecentSearches();
        
        if (searches.length === 0) {
            alert("Nenhum histórico de pesquisa para exportar.");
            return;
        }

        const dataStr = JSON.stringify(searches, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileName = sessionToExport
            ? `jjia_export_${sessionToExport.query.substring(0, 15).replace(/ /g, '_')}_${timestamp}.json`
            : `jjia_export_full_${timestamp}.json`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to export search history", error);
        alert("Ocorreu um erro ao tentar exportar os dados.");
    }
};

export const exportArticleAsHtml = (articleHtml: string, query: string): void => {
    const abntCss = `
        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            background-color: #fff;
            color: #000;
        }
        @media print {
            @page {
                size: A4;
                margin: 3cm 2cm 2cm 3cm; /* top, right, bottom, left */
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        .abnt-cover-page {
            text-align: center;
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            font-weight: bold;
        }
        h1 {
            font-size: 14pt;
            text-align: center;
            text-transform: uppercase;
            margin-top: 3cm;
            margin-bottom: 2cm;
        }
        h2 {
            font-size: 12pt;
            text-transform: uppercase;
            margin-top: 1.5cm;
            margin-bottom: 1cm;
        }
        p {
            text-indent: 1.25cm;
            text-align: justify;
            margin: 0;
            padding: 0;
            margin-bottom: 0.5cm;
        }
        div#abnt-references ul {
            list-style: none;
            padding-left: 0;
        }
        div#abnt-references li {
            text-indent: -1.25cm;
            padding-left: 1.25cm;
            margin-bottom: 0.5cm;
            line-height: 1.2;
        }
        a {
            color: #000;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        strong, b {
            font-weight: bold;
        }
        em, i {
            font-style: italic;
        }
    `;

    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artigo Científico: ${query}</title>
    <style>${abntCss}</style>
</head>
<body>
    ${articleHtml}
</body>
</html>`;

    try {
        const dataBlob = new Blob([fullHtml.trim()], { type: 'text/html' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `artigo_${query.substring(0, 20).replace(/ /g, '_')}_${timestamp}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export article as HTML", error);
        alert("Ocorreu um erro ao tentar exportar o artigo.");
    }
};

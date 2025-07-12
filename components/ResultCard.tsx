
import React, { useState } from 'react';
import { SearchResult } from '../types';
import { LinkIcon, CheckIcon } from './Icons';

interface ResultCardProps {
  result: SearchResult;
  selectionMode: boolean;
  onSelect: () => void;
  onOpenInBrowser: () => void;
}

const ImageLoader: React.FC = () => (
    <div className="absolute inset-0 w-full h-full bg-stone-800/50 animate-pulse flex items-center justify-center">
        <svg className="w-10 h-10 text-stone-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
    </div>
)

const ResultCard: React.FC<ResultCardProps> = ({ result, selectionMode, onSelect, onOpenInBrowser }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const domain = result.url ? new URL(result.url).hostname.replace('www.','') : 'N/A';

  const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
        return;
    }
    e.preventDefault();
    if (selectionMode) {
      onSelect();
    } else {
      onOpenInBrowser();
    }
  };

  return (
    <div className="group relative" >
        <div className="spotlight"></div>
        <div 
            className={`book-card ${result.selected ? 'selected' : ''}`}
            onClick={handleInteraction}
            onKeyDown={handleInteraction}
            role="button"
            tabIndex={0}
            aria-label={`Select or open article: ${result.title}`}
        >
            <div className="book-card-inner">
                {(!imageLoaded || !result.coverImageUrl) && <ImageLoader />}
                {result.coverImageUrl && (
                  <img 
                      src={result.coverImageUrl} 
                      alt={`Cover for ${result.title}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(false)}
                  />
                )}
                
                {result.selected && (
                    <div className="book-selection-overlay">
                        <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className="book-info-plate">
            <h3 className="text-sm font-bold text-stone-100 leading-tight two-line-truncate" title={result.title}>{result.title}</h3>
            <div className="flex items-center justify-center gap-1.5 min-w-0 mt-1.5 text-xs text-stone-400">
                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                <p className="truncate" title={domain}>{domain}</p>
            </div>
        </div>
    </div>
  );
};

export default ResultCard;
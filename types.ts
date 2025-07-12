

export interface SearchResult {
  title: string;
  url: string;
  coverImageUrl: string;
  // AI-enriched data
  rating?: number;
  tags?: string[];
  briefSummary?: string;
  publicationYear?: number;
  authors?: string[];
  contentHtml?: string;
  // UI state
  selected?: boolean;
}

export interface ProcessedSourceData {
    title: string;
    url:string;
    rating: number;
    tags: string[];
    briefSummary: string;
    publicationYear: number;
    authors: string[];
    contentHtml: string;
    error?: string;
}

export interface BrainstormingNode {
  idea: string;
  details: string;
  sourceIndices: number[];
  subNodes?: BrainstormingNode[];
}

export interface BrainstormingData {
  centralTheme: string;
  mainIdeas: BrainstormingNode[];
}

export interface SearchSession {
  query: string;
  summary: string;
  results: SearchResult[];
  brainstormingData?: BrainstormingData;
  timestamp: number;
  selectionMode?: boolean;
}

export enum AppStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum AppView {
    SEARCH,
    EDITOR,
    BROWSER,
}

export interface NewspaperSnippet {
  headline: string;
  text: string;
}

export interface ComicPanel {
  dialogue: string;
}
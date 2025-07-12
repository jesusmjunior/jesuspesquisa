
import React, { useRef, useEffect } from 'react';

interface ArticleEditorProps {
    articleHtml: string;
    setArticleHtml: (html: string) => void;
    onBackToSearch: () => void;
    onExportArticle: () => void;
}

const EditorButton: React.FC<{ onExecute: () => void, children: React.ReactNode, title: string }> = ({ onExecute, children, title }) => (
    <button
        onClick={onExecute}
        title={title}
        className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors text-stone-200"
        onMouseDown={e => e.preventDefault()} // Prevent editor from losing focus
    >
        {children}
    </button>
);


const ArticleEditor: React.FC<ArticleEditorProps> = ({ articleHtml, setArticleHtml, onBackToSearch, onExportArticle }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync state from parent to editor (e.g., when new article is generated)
    useEffect(() => {
        if (editorRef.current && articleHtml !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = articleHtml;
        }
    }, [articleHtml]);

    const handleContentChange = () => {
        if (editorRef.current) {
            setArticleHtml(editorRef.current.innerHTML);
        }
    };

    const execCmd = (command: string) => {
        document.execCommand(command, false, undefined);
        editorRef.current?.focus();
        handleContentChange();
    };


    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-amber-200/90">Editor de Artigo Científico</h2>
                <div className="flex gap-4">
                    <button
                        onClick={onBackToSearch}
                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-md transition-colors font-medium text-stone-200"
                    >
                        &larr; Voltar
                    </button>
                    <button
                        onClick={onExportArticle}
                        className="px-4 py-2 bg-sky-800 hover:bg-sky-700 text-sky-100 font-semibold rounded-md transition-colors"
                    >
                        Exportar HTML (ABNT)
                    </button>
                </div>
            </div>

            <div className="bg-stone-800/50 border border-stone-700 rounded-t-lg p-2 flex gap-2 sticky top-2 z-10">
                 <EditorButton onExecute={() => execCmd('bold')} title="Negrito (Ctrl+B)">
                    <span className="font-bold">B</span>
                </EditorButton>
                <EditorButton onExecute={() => execCmd('italic')} title="Itálico (Ctrl+I)">
                    <span className="italic">I</span>
                </EditorButton>
            </div>
            <div 
                ref={editorRef}
                contentEditable={true}
                onInput={handleContentChange}
                className="bg-white text-black p-8 sm:p-12 md:p-16 rounded-b-md shadow-lg outline-none focus:ring-2 ring-amber-400 min-h-[70vh] overflow-y-auto"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '12pt', lineHeight: '1.5' }}
                dangerouslySetInnerHTML={{ __html: articleHtml }} 
                spellCheck={false}
            />
        </div>
    );
};

export default ArticleEditor;

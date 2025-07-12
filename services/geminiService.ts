
import { GoogleGenAI, GroundingChunk, Type } from "@google/genai";
import { SearchResult, BrainstormingData, ProcessedSourceData, NewspaperSnippet, ComicPanel } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GroundedResponse {
    summary: string;
    sources: GroundingChunk[];
}

export const generateCoverImage = async (title: string, briefSummary: string): Promise<string> => {
    const prompt = `Create a photorealistic book cover for a literary work or academic article titled "${title}". 
    Summary: "${briefSummary}". 
    The cover should look like a real, physical book. It should be high-quality, professional, and emblematic of the content. 
    The style should be serious and academic or classic and literary, depending on the topic. Avoid text unless absolutely necessary to convey the theme. Avoid cartoonish or overly digital styles.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '3:4',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("Image generation returned no images.");
    } catch (error) {
        console.error(`Error generating cover for "${title}":`, error);
        return '';
    }
};

export const translateText = async (text: string, targetLanguage: 'English' | 'Portuguese'): Promise<string> => {
    const prompt = `Translate the following text to ${targetLanguage}. Return only the translated text, without any introductory phrases. Text to translate: "${text}"`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw new Error("Failed to translate text.");
    }
};

export const generateGroundedResponse = async (query: string): Promise<GroundedResponse> => {
  const prompt = `Você é um assistente de pesquisa prestativo. Baseado nos resultados de busca, escreva um resumo conciso de um parágrafo respondendo à consulta do usuário: "${query}". Sua resposta deve ser em português. Não liste as fontes na sua resposta, apenas forneça o texto do resumo. Se os resultados forem irrelevantes ou vazios, declare que não conseguiu encontrar informações relevantes.`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
            temperature: 0.1,
        },
    });

    const summary = response.text.trim();
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { summary, sources };

  } catch (error) {
    console.error("Error generating grounded response:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("A resposta foi bloqueada devido a políticas de segurança. Por favor, tente uma consulta diferente.");
    }
    throw new Error("Não foi possível processar sua solicitação. Verifique sua consulta ou tente novamente mais tarde.");
  }
};

export const processSingleSource = async (sourceUri: string, query: string): Promise<ProcessedSourceData> => {
    const prompt = `Como um assistente de pesquisa IA, analise a URL abaixo em relação à consulta do usuário: "${query}".
Acesse o conteúdo da URL, analise-o e extraia as informações solicitadas.
Sua resposta DEVE ser um único objeto JSON que segue estritamente o schema fornecido.

Para a URL, forneça:
- "title": O título principal do artigo. Se não encontrar, use o título do metadado.
- "url": A URL original que você processou (${sourceUri}).
- "rating": Um número de 1 a 5 (pode ser float) indicando a relevância do conteúdo para a consulta.
- "tags": Um array de 3 a 5 strings (palavras-chave curtas) que descrevem o tópico.
- "briefSummary": Um resumo conciso de uma única frase sobre as conclusões ou o tema principal do documento.
- "publicationYear": O ano de publicação estimado como um número INTEIRO. Se não for encontrado, use 0.
- "authors": Um array de strings com os nomes dos autores (ex: "Silva, J."). Se não encontrar, retorne um array vazio.
- "contentHtml": O HTML limpo do corpo principal do artigo, focado no conteúdo legível. Remova navegação, rodapés, anúncios e scripts. Se a extração falhar, retorne uma string vazia.
- "error": Se você não conseguir acessar ou processar a URL, inclua uma breve string de erro aqui e preencha os outros campos com valores padrão. Caso contrário, omita este campo.

URL para Processamento: ${sourceUri}
`;
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            briefSummary: { type: Type.STRING },
            publicationYear: { type: Type.INTEGER },
            authors: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentHtml: { type: Type.STRING, description: "O conteúdo HTML limpo do corpo do artigo." },
            error: { type: Type.STRING, description: "Mensagem de erro se o processamento da URL falhar." },
        },
        required: ["title", "url", "rating", "tags", "briefSummary", "publicationYear", "authors", "contentHtml"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.1,
            },
        });

        const parsedData = JSON.parse(response.text);
        // Ensure the URL is the one we requested, as model might hallucinate it.
        parsedData.url = sourceUri;
        return parsedData as ProcessedSourceData;

    } catch (error) {
        console.error(`Error processing source ${sourceUri}:`, error);
        return {
            title: "Processamento Falhou",
            url: sourceUri,
            rating: 0,
            tags: ["Erro"],
            briefSummary: "Não foi possível analisar esta fonte devido a um erro na API.",
            publicationYear: 0,
            authors: [],
            contentHtml: "",
            error: error instanceof Error ? error.message : "Erro desconhecido na API."
        };
    }
};

export const processSourcesAndExtractContent = async (sources: GroundingChunk[], query: string): Promise<ProcessedSourceData[]> => {
    const sourceUris = sources.map(s => s.web?.uri).filter((uri): uri is string => !!uri);

    if (sourceUris.length === 0) {
        return [];
    }

    const processingPromises = sourceUris.map(uri => processSingleSource(uri, query));
    
    const results = await Promise.all(processingPromises);

    return results;
};

export const generateBrainstormingMap = async (results: SearchResult[], theme: string): Promise<BrainstormingData> => {
    const documents = results.map((r, index) => ({
        index,
        title: r.title,
        summary: r.briefSummary,
    }));
    
    const prompt = `Você é um analista de pesquisa e estrategista. Sua tarefa é criar um "mapa de brainstorming" a partir de uma lista de documentos, centrado em um tema definido pelo usuário.
    
Tema Central: "${theme}"

Documentos Fornecidos:
${documents.map(d => `[${d.index}] ${d.title}: ${d.summary}`).join('\n')}

Analise os documentos e identifique as principais ideias, argumentos e pontos de dados que se relacionam com o tema central. Estruture sua análise como um mapa mental hierárquico.

Sua resposta DEVE ser um único objeto JSON que segue estritamente o schema fornecido.
- O "centralTheme" deve ser o tema que eu forneci.
- Identifique de 3 a 5 "mainIdeas" (ideias principais) que são os ramos mais importantes que emergem do tema central.
- Para cada "mainIdea", forneça "subNodes" detalhados. Estes são os pontos de evidência, exemplos ou argumentos de apoio encontrados nos documentos.
- Para cada ideia e sub-nó, preencha o campo "sourceIndices" com os índices dos documentos que suportam essa afirmação.
- Seja conciso e direto. O objetivo é mapear as "sinapses" conceituais entre os documentos em relação ao tema.`;

    const subNodeSchema = {
        type: Type.OBJECT,
        properties: {
            idea: { type: Type.STRING, description: 'O ponto de evidência ou sub-ideia concisa.'},
            details: { type: Type.STRING, description: 'Detalhes específicos ou citação que suporta a sub-ideia.'},
            sourceIndices: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Array de índices (base 0) do documento específico que suporta este ponto.'}
        },
        required: ['idea', 'details', 'sourceIndices']
    };

    const brainstormingSchema = {
        type: Type.OBJECT,
        properties: {
            centralTheme: { type: Type.STRING, description: 'O tema central da análise, conforme fornecido pelo usuário.' },
            mainIdeas: {
                type: Type.ARRAY,
                description: 'Os principais ramos de ideias que emanam do tema central.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        idea: { type: Type.STRING, description: 'O título da ideia principal.' },
                        details: { type: Type.STRING, description: 'Uma breve explicação sobre como esta ideia se conecta ao tema central e às fontes.' },
                        sourceIndices: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Array de índices (base 0) dos documentos que suportam esta ideia.' },
                        subNodes: {
                            type: Type.ARRAY,
                            description: 'Ideias ou pontos de evidência mais detalhados que se ramificam a partir da ideia principal.',
                            items: subNodeSchema
                        }
                    },
                    required: ['idea', 'details', 'sourceIndices']
                }
            }
        },
        required: ['centralTheme', 'mainIdeas']
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: brainstormingSchema,
                temperature: 0.2,
            }
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error generating brainstorming map:", error);
        throw new Error("Não foi possível gerar o mapa de brainstorming. A resposta do modelo pode ser inválida.");
    }
};

export const generateScientificArticle = async (selectedResults: SearchResult[], topic: string): Promise<string> => {
    const sourcesText = selectedResults.map(r => 
        `Fonte: ${r.title}\nAutores: ${r.authors?.join(', ') || 'N/A'}\nAno: ${r.publicationYear || 'N/A'}\nResumo: ${r.briefSummary}\nURL: ${r.url}`
    ).join('\n\n---\n\n');

    const prompt = `Você é um acadêmico especialista encarregado de escrever um artigo de revisão no formato ABNT.
    
    Tópico do Artigo: "${topic}"
    
    Fontes Disponibilizadas:
    ${sourcesText}
    
    Sua tarefa é gerar o conteúdo HTML para um artigo científico completo e bem estruturado. O resultado deve ser apenas o HTML contido dentro da tag <body>.
    
    O artigo deve incluir as seguintes seções, todas em português:
    1.  Capa (classe "abnt-cover-page"): Título do artigo, nome do autor ("J.J. I.A."), local ("Brasil") e ano (atual).
    2.  Introdução: Apresente o tópico, sua relevância e os objetivos do artigo.
    3.  Desenvolvimento: Crie seções (com tags <h2>) para discutir os principais temas encontrados nas fontes. Sintetize as informações, compare e contraste as perspectivas dos autores. Faça citações (não diretas) às fontes quando apropriado, por exemplo, (SOBRENOME, ANO).
    4.  Conclusão: Resuma os pontos principais e apresente uma conclusão geral baseada na síntese das fontes.
    5.  Referências (div com id "abnt-references"): Liste TODAS as fontes fornecidas em uma lista não ordenada (<ul>), formatada estritamente no padrão ABNT. Use os dados (autores, título, ano, url) fornecidos.

    REGRAS IMPORTANTES:
    - O HTML deve ser limpo e semântico (use <h1>, <h2>, <p>, <ul>, <li>).
    - Não inclua NENHUM CSS.
    - Não inclua as tags <html>, <head>, ou <body>. Apenas o conteúdo interno do body.
    - Siga as normas da ABNT para formatação de texto e, crucialmente, para a seção de Referências.
    - Seja formal, objetivo e acadêmico em seu tom.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.4,
            },
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error generating scientific article:", error);
        throw new Error("Não foi possível gerar o artigo científico.");
    }
};

export const generateNewspaperSnippets = async (articleHtml: string, articleTitle: string): Promise<NewspaperSnippet[]> => {
    const prompt = `A partir do conteúdo HTML e do título de um artigo, gere 3 "notas curtas" para a lateral de um jornal. Cada nota deve ter uma manchete curta e chamativa e um texto de uma frase. O tom deve ser de um jornal clássico. Não use o título principal do artigo.
    
    Título do Artigo: "${articleTitle}"
    Conteúdo HTML: "${articleHtml.substring(0, 3000)}..."
    
    Sua resposta DEVE ser um único objeto JSON que segue estritamente o schema fornecido.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                headline: { type: Type.STRING },
                text: { type: Type.STRING }
            },
            required: ["headline", "text"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.6,
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating newspaper snippets:", error);
        return [];
    }
}

export const generateComicImage = async (topic: string): Promise<string> => {
    const prompt = `Gere uma única imagem que se pareça com uma charge clássica de jornal, em preto e branco, com 3 painéis. A charge deve ser silenciosa (sem texto ou balões de fala) e contar uma pequena história humorística sobre o tema: "${topic}". O estilo deve ser minimalista, como um cartoon desenhado à mão. A imagem deve ser dividida em três painéis distintos, dispostos horizontalmente.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        }
        throw new Error("Image generation returned no images for comic strip.");
    } catch (error) {
        console.error(`Error generating comic image for "${topic}":`, error);
        return '';
    }
};

export const generateComicStripPanels = async (topic: string): Promise<ComicPanel[]> => {
    const prompt = `Você é um comediante e roteirista de quadrinhos. Crie uma piada de 3 partes (uma para cada painel) sobre o tema: "${topic}".
A piada deve ser inteligente, contextual e genuinamente engraçada, adequada para um jornal. O texto será sobreposto à imagem como uma legenda para cada painel.
Forneça apenas o texto para cada um dos 3 painéis. Seja conciso e espirituoso.
Sua resposta DEVE ser um único objeto JSON que segue estritamente o schema fornecido, contendo um array de exatamente 3 itens.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                dialogue: { type: Type.STRING, description: 'O texto da legenda para um único painel.' },
            },
            required: ["dialogue"]
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            }
        });
        const panels = JSON.parse(response.text);
        // Ensure we return exactly 3 panels, even if the API misbehaves
        if (Array.isArray(panels) && panels.length === 3) {
            return panels;
        }
        // Fallback if the API returns a wrong number of items
        throw new Error("API did not return 3 panels.");
    } catch (error) {
        console.error("Error generating comic strip panels:", error);
        // Return a structured error-state placeholder
        return [
            { dialogue: 'Não foi possível gerar a legenda.' },
            { dialogue: 'Ocorreu um erro na IA.' },
            { dialogue: 'Tente novamente mais tarde.' },
        ];
    }
}

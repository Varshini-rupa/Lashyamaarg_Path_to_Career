/**
 * RAG Pipeline for Lakshyamaarg Career Chatbot
 * 
 * Complete pipeline following the RAG architecture:
 * Document Collection → Chunking → Embedding → Vector Store → Similarity Search → Retrieval
 * 
 * Reference: Varshini's RAG Pipeline Building notebook
 * Adapted from Python (SentenceTransformer + NumPy) to Node.js (Gemini Embeddings API)
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// ─── Configuration ───────────────────────────────────────────────────
const VECTOR_STORE_PATH = path.join(__dirname, 'vector_store.json');
const RAG_DOCS_DIR = path.join(__dirname, 'rag_documents');
const CHUNK_MAX_WORDS = 100;
const CHUNK_OVERLAP = 20;
const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.3;
const EMBEDDING_MODEL = 'gemini-embedding-001';

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ─── Part 1: Document Chunking (from notebook Task 1.1 & 1.2) ───────

/**
 * Word-based chunking with overlap
 * Reference: chunk_by_words() from notebook
 */
function chunkByWords(text, maxWords = CHUNK_MAX_WORDS, overlap = CHUNK_OVERLAP) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const chunks = [];
    const step = maxWords - overlap;

    if (step <= 0) return [text];

    for (let i = 0; i < words.length; i += step) {
        const chunkWords = words.slice(i, i + maxWords);
        const chunk = chunkWords.join(' ');
        chunks.push(chunk);

        // Prevent duplicate small chunk at the end
        if (i + maxWords >= words.length) break;
    }

    return chunks;
}

/**
 * Sentence-based chunking
 * Reference: chunk_by_sentences() from notebook
 */
function chunkBySentences(text, maxSentences = 3) {
    const rawSentences = text.split(/(?<=[.!?])\s+/);
    const sentences = rawSentences
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.');

    const chunks = [];
    for (let i = 0; i < sentences.length; i += maxSentences) {
        const chunk = sentences.slice(i, i + maxSentences).join(' ');
        chunks.push(chunk);
    }

    return chunks;
}

/**
 * Hybrid chunking: splits by paragraphs first, then by word count
 * Best for markdown documents
 */
function chunkDocument(text, maxWords = CHUNK_MAX_WORDS, overlap = CHUNK_OVERLAP) {
    // Split by double newlines (paragraphs) first
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
    const allChunks = [];

    for (const para of paragraphs) {
        const cleanPara = para.replace(/^#+\s*/gm, '').trim();
        if (cleanPara.length < 20) continue;

        const wordCount = cleanPara.split(/\s+/).length;

        if (wordCount <= maxWords) {
            // Small enough — keep as single chunk
            allChunks.push(cleanPara);
        } else {
            // Too long — use word-based chunking with overlap
            const subChunks = chunkByWords(cleanPara, maxWords, overlap);
            allChunks.push(...subChunks);
        }
    }

    return allChunks;
}

// ─── Part 2: Embeddings (from notebook Task 2.1 & 2.2) ──────────────

/**
 * Generate embedding for a single text using Gemini embedding model
 * Reference: model.encode() from notebook, but using Gemini API instead of SentenceTransformer
 */
async function generateEmbedding(text) {
    if (!ai) throw new Error('Gemini API key not configured');

    const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
    });
    return response.embeddings[0].values;
}

/**
 * Generate embeddings for multiple texts (batch)
 * Reference: create_embeddings() from notebook
 */
async function generateEmbeddings(texts) {
    console.log(`  🧮 Generating embeddings for ${texts.length} chunks...`);
    const embeddings = [];

    // Process one at a time to avoid rate limits
    for (let i = 0; i < texts.length; i++) {
        try {
            const embedding = await generateEmbedding(texts[i]);
            embeddings.push(embedding);
        } catch (err) {
            console.error(`\n  ⚠️ Error on chunk ${i + 1}: ${err.message}. Retrying...`);
            await new Promise(r => setTimeout(r, 2000));
            const embedding = await generateEmbedding(texts[i]);
            embeddings.push(embedding);
        }

        // Small delay between API calls
        if (i < texts.length - 1) {
            await new Promise(r => setTimeout(r, 100));
        }
        process.stdout.write(`\r  🧮 Embedded ${i + 1}/${texts.length} chunks`);
    }
    console.log('');

    return embeddings;
}

// ─── Part 3: Cosine Similarity (from notebook Task 2.3) ─────────────

/**
 * Cosine similarity between two vectors
 * Reference: cosine_similarity() from notebook
 * cos(θ) = (A · B) / (||A|| × ||B||)
 */
function cosineSimilarity(vecA, vecB) {
    // Step 1: Compute dot product
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
    }

    // Step 2: Compute L2 norms (Euclidean length)
    let normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    // Step 3: Divide dot product by product of norms
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
}

// ─── Part 4: Vector Store (JSON-based) ──────────────────────────────

/**
 * Load vector store from JSON file
 */
function loadVectorStore() {
    if (fs.existsSync(VECTOR_STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf-8'));
        console.log(`  📂 Loaded vector store: ${data.chunks.length} chunks, ${data.metadata.embedding_dimensions}D embeddings`);
        return data;
    }
    return null;
}

/**
 * Save vector store to JSON file
 */
function saveVectorStore(store) {
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(store, null, 2));
    console.log(`  💾 Saved vector store: ${store.chunks.length} chunks to ${VECTOR_STORE_PATH}`);
}

// ─── Part 5: Retrieval (from notebook Task 3.1 & 3.2) ───────────────

/**
 * Search for similar chunks given a query
 * Reference: retrieve_with_threshold() from notebook
 * 
 * Pipeline:
 * 1. Encode query into embedding
 * 2. Compute cosine similarity with all stored chunk embeddings  
 * 3. Sort by similarity score (highest first)
 * 4. Filter by threshold and return top_k
 */
async function searchSimilar(query, topK = TOP_K, threshold = SIMILARITY_THRESHOLD) {
    const store = loadVectorStore();
    if (!store || !store.chunks.length) {
        console.log('  ⚠️ Vector store empty or not found. Run indexing first.');
        return [];
    }

    // Step 1: Encode the query into an embedding
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Calculate similarity between query and all chunk embeddings
    const similarities = [];
    for (let i = 0; i < store.embeddings.length; i++) {
        const simScore = cosineSimilarity(queryEmbedding, store.embeddings[i]);
        similarities.push({
            index: i,
            score: simScore,
            chunk: store.chunks[i],
            source: store.sources[i],
        });
    }

    // Step 3: Sort by similarity (highest first)
    similarities.sort((a, b) => b.score - a.score);

    // Step 4: Filter by threshold and limit to top_k
    const results = similarities
        .filter(item => item.score >= threshold)
        .slice(0, topK);

    return results;
}

// ─── Part 6: Full Indexing Pipeline ─────────────────────────────────

/**
 * Complete indexing pipeline:
 * 1. Read all markdown documents from rag_documents/
 * 2. Split each into chunks using hybrid chunking
 * 3. Generate embeddings for all chunks using Gemini
 * 4. Save to vector_store.json
 * 
 * Reference: RetrievalPipeline.add_documents() from notebook
 */
async function indexDocuments() {
    console.log('\n🚀 Starting RAG Indexing Pipeline...\n');

    // Step 1: Read documents
    console.log('📄 Step 1: Document Collection');
    const docFiles = fs.readdirSync(RAG_DOCS_DIR).filter(f => f.endsWith('.md'));
    console.log(`  Found ${docFiles.length} documents: ${docFiles.join(', ')}`);

    const allChunks = [];
    const allSources = [];

    // Step 2: Chunk documents
    console.log('\n✂️ Step 2: Document Chunking');
    for (const file of docFiles) {
        const content = fs.readFileSync(path.join(RAG_DOCS_DIR, file), 'utf-8');
        const chunks = chunkDocument(content, CHUNK_MAX_WORDS, CHUNK_OVERLAP);
        console.log(`  📄 ${file}: ${chunks.length} chunks created`);

        for (const chunk of chunks) {
            allChunks.push(chunk);
            allSources.push(file.replace('.md', ''));
        }
    }
    console.log(`  Total chunks: ${allChunks.length}`);

    // Step 3: Generate embeddings
    console.log('\n🧮 Step 3: Generating Embeddings');
    const embeddings = await generateEmbeddings(allChunks);
    console.log(`  Embedding dimensions: ${embeddings[0]?.length || 0}`);

    // Step 4: Save to vector store
    console.log('\n💾 Step 4: Saving to Vector Store');
    const store = {
        metadata: {
            total_chunks: allChunks.length,
            embedding_dimensions: embeddings[0]?.length || 0,
            documents: docFiles,
            indexed_at: new Date().toISOString(),
            embedding_model: EMBEDDING_MODEL,
            chunk_config: { maxWords: CHUNK_MAX_WORDS, overlap: CHUNK_OVERLAP },
        },
        chunks: allChunks,
        sources: allSources,
        embeddings: embeddings,
    };
    saveVectorStore(store);

    // Step 5: Print stats (like pipeline.get_stats() from notebook)
    console.log('\n📊 Pipeline Statistics:');
    console.log(`  Total documents: ${docFiles.length}`);
    console.log(`  Total chunks: ${allChunks.length}`);
    console.log(`  Embedding dimensions: ${embeddings[0]?.length || 0}`);
    console.log(`  Avg chunk length (words): ${Math.round(allChunks.reduce((sum, c) => sum + c.split(/\s+/).length, 0) / allChunks.length)}`);
    console.log(`  Vector store size: ${(fs.statSync(VECTOR_STORE_PATH).size / 1024).toFixed(1)} KB`);
    console.log('\n✅ RAG Indexing Complete!\n');

    return store;
}

// ─── Get RAG Stats ──────────────────────────────────────────────────

function getStats() {
    const store = loadVectorStore();
    if (!store) return { indexed: false };

    return {
        indexed: true,
        total_chunks: store.chunks.length,
        total_documents: store.metadata.documents.length,
        documents: store.metadata.documents,
        embedding_dimensions: store.metadata.embedding_dimensions,
        embedding_model: store.metadata.embedding_model,
        indexed_at: store.metadata.indexed_at,
    };
}

// ─── Exports ────────────────────────────────────────────────────────

module.exports = {
    // Chunking functions
    chunkByWords,
    chunkBySentences,
    chunkDocument,
    // Embedding functions
    generateEmbedding,
    generateEmbeddings,
    // Similarity
    cosineSimilarity,
    // Vector store
    loadVectorStore,
    saveVectorStore,
    // Retrieval
    searchSimilar,
    // Full pipeline
    indexDocuments,
    // Stats
    getStats,
};

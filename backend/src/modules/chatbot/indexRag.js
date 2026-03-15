/**
 * RAG Indexing Script
 * 
 * Run this once to build the vector store:
 *   node src/modules/chatbot/indexRag.js
 * 
 * This will:
 * 1. Read all .md documents from rag_documents/
 * 2. Chunk them into smaller pieces
 * 3. Generate Gemini embeddings for each chunk
 * 4. Save everything to vector_store.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { indexDocuments, getStats } = require('./ragPipeline');

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Lakshyamaarg RAG Indexing Pipeline');
    console.log('  Embedding Model: Gemini text-embedding-004');
    console.log('═══════════════════════════════════════════════════');

    if (!process.env.GEMINI_API_KEY) {
        console.error('\n❌ GEMINI_API_KEY not found in .env file!');
        process.exit(1);
    }

    try {
        const startTime = Date.now();

        // Run the full indexing pipeline
        await indexDocuments();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`⏱️  Total time: ${elapsed} seconds`);

        // Print final stats
        const stats = getStats();
        console.log('\n📊 Final Vector Store Stats:');
        console.log(JSON.stringify(stats, null, 2));

    } catch (err) {
        console.error('\n❌ Indexing failed:', err.message);
        process.exit(1);
    }
}

main();

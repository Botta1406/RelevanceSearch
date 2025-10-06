#!/bin/bash

echo "🚀 Setting up AI Document Search Engine..."

# Check if Ollama is running
echo "📡 Checking Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running. Please start it with: ollama serve"
    exit 1
fi

# Check if Qdrant is running
echo "📡 Checking Qdrant connection..."
if curl -s http://localhost:6333/collections > /dev/null; then
    echo "✅ Qdrant is running"
else
    echo "❌ Qdrant is not running. Please start it with:"
    echo "   docker run -p 6333:6333 qdrant/qdrant"
    exit 1
fi

# Pull embedding model if not exists
echo "🤖 Checking for embedding models..."
if ollama list | grep -q "nomic-embed-text"; then
    echo "✅ Embedding model found"
else
    echo "📥 Pulling embedding model..."
    ollama pull nomic-embed-text
fi

echo "🎉 Setup complete! You can now run: npm run dev"
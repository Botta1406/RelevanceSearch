// scripts/generateCVs.ts
import fs from 'fs';
import path from 'path';

const roles = [
    'iOS Swift developer',
    'Android Kotlin developer',
    'React Native developer',
    'Flutter developer',
    'Backend Python Django developer',
    'Cloud AWS architect',
    'Frontend Vue.js developer',
    'PHP Laravel developer',
];

const languages = ['english'];
const experienceLevels = ['2 years', '3 years', '5 years', '7 years', '10 years'];

async function getAvailableModels(): Promise<string[]> {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
        return [];
    }
}

async function generateCVWithAI(role: string, experience: string, language: string, modelName: string): Promise<string> {
    const prompt = `Generate a realistic CV/resume in ${language} language for a ${role} with ${experience} of experience.

IMPORTANT: Do NOT use the words "mobile" or "developer" in the CV. Instead use specific terms like:
- For iOS: Swift, UIKit, SwiftUI, Xcode, Core Data, etc.
- For Android: Kotlin, Java, Jetpack Compose, Android Studio, Room, etc.
- For React Native: React, JavaScript, Redux, Expo, etc.

Include:
1. Name (realistic ${language} name)
2. Professional summary (without "mobile" or "developer" keywords)
3. Technical skills (specific technologies only)
4. Work experience (2-3 positions)
5. Education
6. Projects

Keep it realistic and around 400-500 words. Use natural ${language} language.`;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                prompt: prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('❌ Error details:', error);
        throw error;
    }
}

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

async function checkOllama(): Promise<string | null> {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
            const data = await response.json();
            const models = data.models?.map((m: any) => m.name) || [];

            console.log('📦 Available models:', models.join(', '));

            // Try to find a suitable model
            const preferredModels = ['llama3.2', 'llama3.1', 'llama3', 'llama2', 'mistral'];

            for (const preferred of preferredModels) {
                const found = models.find((m: string) => m.includes(preferred));
                if (found) {
                    return found;
                }
            }

            // If no preferred model, use the first available
            if (models.length > 0) {
                return models[0];
            }

            console.error('❌ No models found. Please pull a model:');
            console.error('   ollama pull llama3.2');
            return null;
        }
        return null;
    } catch (error) {
        console.error('❌ Cannot connect to Ollama. Make sure it is running:');
        console.error('   Run: ollama serve');
        return null;
    }
}

async function main() {
    // Check Ollama connection first
    console.log('🔍 Checking Ollama connection...\n');
    const modelName = await checkOllama();

    if (!modelName) {
        console.error('\n💡 To fix this:');
        console.error('   1. Start Ollama: ollama serve');
        console.error('   2. Pull model: ollama pull llama3.2');
        console.error('   3. Run this script again\n');
        process.exit(1);
    }

    console.log(`✅ Using model: ${modelName}\n`);

    const outputDir = path.join(process.cwd(), 'generated-cvs');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🚀 Generating 100 multilingual CVs with AI...\n');
    console.log('⏳ This will take several minutes...\n');

    let count = 0;
    const stats: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
        const role = getRandomElement(roles);
        const experience = getRandomElement(experienceLevels);
        const language = getRandomElement(languages);
        const index = i + 1;

        stats[language] = (stats[language] || 0) + 1;

        console.log(`[${index}/100] Generating CV for ${role} (${language})...`);

        try {
            const cv = await generateCVWithAI(role, experience, language, modelName);
            const filename = `cv_${index.toString().padStart(3, '0')}_${language}.txt`;
            const filepath = path.join(outputDir, filename);

            fs.writeFileSync(filepath, cv, 'utf-8');
            console.log(`✅ Generated: ${filename}`);
            count++;
        } catch (error) {
            console.error(`❌ Failed to generate CV ${index}`);
        }

        // Small delay to avoid overwhelming Ollama
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Generation Summary:');
    console.log(`Total CVs: ${count}`);
    console.log('By Language:', stats);
    console.log(`\n✅ CVs saved to: ${outputDir}`);
}

main().catch(console.error);

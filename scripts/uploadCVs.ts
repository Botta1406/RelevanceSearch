import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/upload-document';
const CVS_DIR = path.join(process.cwd(), 'generated-cvs');

async function uploadCV(filePath: string): Promise<boolean> {
    try {
        const fileName = path.basename(filePath);

        const formData = new FormData();
        formData.append('document', fs.createReadStream(filePath), {
            filename: fileName,
            contentType: 'text/plain',
        });

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData as any,
            headers: formData.getHeaders(),
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ ${fileName}`);
            return true;
        } else {
            console.error(`❌ ${fileName}: ${result.error}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        const testResponse = await fetch('http://localhost:3000');
        if (!testResponse.ok) {
            console.error('❌ Next.js not running!');
            console.error('Start it with: npm run dev');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Cannot connect to http://localhost:3000');
        console.error('Start Next.js with: npm run dev');
        process.exit(1);
    }

    if (!fs.existsSync(CVS_DIR)) {
        console.error(`❌ Directory not found: ${CVS_DIR}`);
        console.log('Generate CVs first: npm run generate-cvs');
        process.exit(1);
    }

    const files = fs.readdirSync(CVS_DIR)
        .filter(file => file.endsWith('.txt') && file.startsWith('cv_'))
        .map(file => path.join(CVS_DIR, file));

    if (files.length === 0) {
        console.error('❌ No CV files found');
        process.exit(1);
    }

    console.log(`🚀 Uploading ${files.length} CVs...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`[${i + 1}/${files.length}] ${path.basename(file)}...`);

        const success = await uploadCV(file);

        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Total: ${files.length}`);

    if (successCount > 0) {
        console.log('\n🎉 Done! Check: http://localhost:3000/api/stats');
    }
}

main().catch(console.error);

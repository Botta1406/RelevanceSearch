// scripts/uploadCVs.ts
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api/upload-document';
const CVS_DIR = path.join(process.cwd(), 'generated-cvs');

async function uploadCV(filePath: string): Promise<boolean> {
    try {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Create a Blob from the file content
        const blob = new Blob([fileContent], { type: 'text/plain' });

        const formData = new FormData();
        formData.append('document', blob, fileName);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Uploaded: ${fileName}`);
            return true;
        } else {
            console.error(`❌ Failed: ${fileName} - ${result.error}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error uploading ${path.basename(filePath)}:`, error.message);
        return false;
    }
}

async function main() {
    // Check if dev server is running
    try {
        const testResponse = await fetch('http://localhost:3000');
        if (!testResponse.ok) {
            console.error('❌ Next.js dev server is not running!');
            console.error('Please run: npm run dev (in another terminal)');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Cannot connect to http://localhost:3000');
        console.error('Please start your Next.js app first: npm run dev');
        process.exit(1);
    }

    if (!fs.existsSync(CVS_DIR)) {
        console.error(`❌ Directory not found: ${CVS_DIR}`);
        console.log('Please run: npx tsx scripts/generateCVs.ts first');
        process.exit(1);
    }

    const files = fs.readdirSync(CVS_DIR)
        .filter(file => file.endsWith('.txt') && file.startsWith('cv_'))
        .map(file => path.join(CVS_DIR, file));

    if (files.length === 0) {
        console.error('❌ No CV files found');
        process.exit(1);
    }

    console.log(`🚀 Found ${files.length} CVs to upload\n`);
    console.log('⏳ Starting upload process...\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`[${i + 1}/${files.length}] Uploading ${path.basename(file)}...`);

        const success = await uploadCV(file);

        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Total: ${files.length}`);

    if (successCount > 0) {
        console.log('\n🎉 Upload complete! You can now search for developers.');
        console.log('\nTry these searches:');
        console.log('  - "mobile developers"');
        console.log('  - "iOS engineers"');
        console.log('  - "backend developers"');
    }
}

main().catch(console.error);

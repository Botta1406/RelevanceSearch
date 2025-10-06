import { useState } from 'react';

export default function TestUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
        setResult('');
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult('Uploading...');

        try {
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
            } else {
                setResult(`❌ Error: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (error) {
            setResult(`❌ Network Error: ${error}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
            <h3>Test Document Upload</h3>
            <div style={{ marginBottom: '10px' }}>
                <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    style={{
                        backgroundColor: !file || uploading ? '#ccc' : '#007bff',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !file || uploading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {uploading ? 'Uploading...' : 'Upload & Test'}
                </button>
            </div>
            {result && (
                <pre style={{
                    backgroundColor: '#f5f5f5',
                    padding: '10px',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto'
                }}>
                    {result}
                </pre>
            )}
        </div>
    );
}
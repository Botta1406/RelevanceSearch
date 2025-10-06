import { useState, useEffect } from 'react';
import { FileText, Trash2, RefreshCw, Loader2 } from 'lucide-react';

interface DocumentInfo {
    title: string;
    type: string;
    uploadedAt: string;
    chunksCount: number;
}

interface GetDocumentsResponse {
    success: boolean;
    documents: DocumentInfo[];
}

export default function DocumentListViewer() {
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState('');

    const fetchDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/get-documents');
            const data: GetDocumentsResponse = await response.json();

            if (data.success) {
                setDocuments(data.documents || []);
            } else {
                setError('Failed to fetch documents');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError('Network error: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteDocument = async (title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;

        setDeleting(title);
        try {
            const response = await fetch('/api/remove-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            const data = await response.json();

            if (data.success) {
                await fetchDocuments();
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            alert('Delete failed: ' + errorMessage);
        } finally {
            setDeleting('');
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <div style={{
            maxWidth: '800px',
            margin: '20px auto',
            padding: '24px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <FileText style={{ color: '#00bfff' }} />
                    Uploaded Documents ({documents.length})
                </h2>

                <button
                    onClick={fetchDocuments}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        background: loading ? '#e0e0e0' : '#00bfff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    <RefreshCw
                        size={16}
                        style={{
                            animation: loading ? 'spin 1s linear infinite' : 'none'
                        }}
                    />
                    Refresh
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '12px',
                    background: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            {loading && documents.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666'
                }}>
                    <Loader2
                        size={32}
                        style={{
                            animation: 'spin 1s linear infinite',
                            color: '#00bfff',
                            margin: '0 auto 10px'
                        }}
                    />
                    <p>Loading documents...</p>
                </div>
            ) : documents.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    background: '#f9f9f9',
                    borderRadius: '8px'
                }}>
                    <FileText size={48} style={{ color: '#ccc', margin: '0 auto 10px' }} />
                    <p>No documents uploaded yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {documents.map((doc, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '16px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    marginBottom: '4px',
                                    fontSize: '15px'
                                }}>
                                    {doc.title}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666',
                                    display: 'flex',
                                    gap: '12px'
                                }}>
                                    <span>Type: {doc.type}</span>
                                    <span>•</span>
                                    <span>Chunks: {doc.chunksCount}</span>
                                    <span>•</span>
                                    <span>
                                        Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteDocument(doc.title)}
                                disabled={deleting === doc.title}
                                style={{
                                    padding: '8px 12px',
                                    background: deleting === doc.title ? '#fcc' : 'transparent',
                                    color: '#dc3545',
                                    border: '1px solid #dc3545',
                                    borderRadius: '6px',
                                    cursor: deleting === doc.title ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (deleting !== doc.title) {
                                        e.currentTarget.style.background = '#dc3545';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (deleting !== doc.title) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#dc3545';
                                    }
                                }}
                            >
                                {deleting === doc.title ? (
                                    <>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

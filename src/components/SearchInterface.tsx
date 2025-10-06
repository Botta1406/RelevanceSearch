// nikitha's code
// import { useState, useRef, useEffect } from 'react';
// import {
//     Loader2,
//     CheckCircle,
//     XCircle,
//     RefreshCw,
//     Folder,
//     MessageCircle,
//     Target,
//     Bot,
//     Upload,
//     Send,
//     FileText
// } from 'lucide-react';
//
// interface AskResult {
//     answer: string;
//     sources: Array<{
//         document: string;
//         similarity: string;
//         snippet: string;
//     }>;
//     question: string;
// }
//
// export default function SearchInterface() {
//     const [uploading, setUploading] = useState(false);
//     const [question, setQuestion] = useState('');
//     const [answer, setAnswer] = useState<AskResult | null>(null);
//     const [askingQuestion, setAskingQuestion] = useState(false);
//     const [uploadStatus, setUploadStatus] = useState<string>('');
//     const [uploadedFileName, setUploadedFileName] = useState<string>(''); // New state for filename
//     const [systemStatus, setSystemStatus] = useState<string>('Checking system status...');
//     const [systemStatusType, setSystemStatusType] = useState<'loading' | 'success' | 'error'>('loading');
//     const [isVisible, setIsVisible] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const canvasRef = useRef<HTMLCanvasElement>(null);
//
//     // Icon color constant
//     const iconColor = '#00bfff';
//
//     useEffect(() => {
//         setIsVisible(true);
//         checkSystemStatus();
//         initializeNetwork();
//     }, []);
//
//     const initializeNetwork = () => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//
//         const ctx = canvas.getContext('2d');
//         if (!ctx) return;
//
//         // Set canvas size
//         const resizeCanvas = () => {
//             canvas.width = window.innerWidth;
//             canvas.height = window.innerHeight;
//         };
//         resizeCanvas();
//         window.addEventListener('resize', resizeCanvas);
//
//         // Network points
//         const points: Array<{x: number, y: number, vx: number, vy: number}> = [];
//         const numPoints = 80;
//         const maxDistance = 150;
//
//         // Create random points
//         for (let i = 0; i < numPoints; i++) {
//             points.push({
//                 x: Math.random() * canvas.width,
//                 y: Math.random() * canvas.height,
//                 vx: (Math.random() - 0.5) * 0.5,
//                 vy: (Math.random() - 0.5) * 0.5
//             });
//         }
//
//         // Animation loop
//         const animate = () => {
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//
//             // Update points
//             points.forEach(point => {
//                 point.x += point.vx;
//                 point.y += point.vy;
//
//                 // Bounce off edges
//                 if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
//                 if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
//
//                 // Keep within bounds
//                 point.x = Math.max(0, Math.min(canvas.width, point.x));
//                 point.y = Math.max(0, Math.min(canvas.height, point.y));
//             });
//
//             // Draw connections
//             ctx.strokeStyle = 'rgba(0, 191, 255, 0.2)';
//             ctx.lineWidth = 1;
//             for (let i = 0; i < points.length; i++) {
//                 for (let j = i + 1; j < points.length; j++) {
//                     const dx = points[i].x - points[j].x;
//                     const dy = points[i].y - points[j].y;
//                     const distance = Math.sqrt(dx * dx + dy * dy);
//
//                     if (distance < maxDistance) {
//                         const opacity = (1 - distance / maxDistance) * 0.3;
//                         ctx.strokeStyle = `rgba(0, 191, 255, ${opacity})`;
//                         ctx.beginPath();
//                         ctx.moveTo(points[i].x, points[i].y);
//                         ctx.lineTo(points[j].x, points[j].y);
//                         ctx.stroke();
//                     }
//                 }
//             }
//
//             // Draw points
//             ctx.fillStyle = 'rgba(0, 191, 255, 0.8)';
//             points.forEach(point => {
//                 ctx.beginPath();
//                 ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
//                 ctx.fill();
//             });
//
//             requestAnimationFrame(animate);
//         };
//
//         animate();
//     };
//
//     const checkSystemStatus = async () => {
//         try {
//             setSystemStatus('Checking system status...');
//             setSystemStatusType('loading');
//
//             const ollamaResponse = await fetch('http://localhost:11434/api/tags');
//             const ollamaOk = ollamaResponse.ok;
//
//             const qdrantResponse = await fetch('http://localhost:6333/collections');
//             const qdrantOk = qdrantResponse.ok;
//
//             if (ollamaOk && qdrantOk) {
//                 setSystemStatus('AI that Understands Your Documents');
//                 setSystemStatusType('success');
//             } else if (!ollamaOk && !qdrantOk) {
//                 setSystemStatus('Ollama and Qdrant not running');
//                 setSystemStatusType('error');
//             } else if (!ollamaOk) {
//                 setSystemStatus('Ollama not running (start with: ollama serve)');
//                 setSystemStatusType('error');
//             } else {
//                 setSystemStatus('Qdrant not running (start with Docker)');
//                 setSystemStatusType('error');
//             }
//         } catch (error) {
//             setSystemStatus('Cannot connect to services');
//             setSystemStatusType('error');
//         }
//     };
//
//     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         if (file.size > 10 * 1024 * 1024) {
//             alert('File size must be less than 10MB');
//             return;
//         }
//
//         const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd-openxmlformats-officedocument.wordprocessingml.document'];
//         if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|docx)$/i)) {
//             alert('Please upload a PDF, TXT, or DOCX file');
//             return;
//         }
//
//         setUploading(true);
//         setUploadStatus('Uploading file...');
//         setUploadedFileName(''); // Clear previous filename
//
//         try {
//             const formData = new FormData();
//             formData.append('document', file);
//
//             const response = await fetch('/api/upload-document', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             const data = await response.json();
//
//             if (data.success) {
//                 setUploadStatus('Your document has been uploaded successfully!');
//                 setUploadedFileName(file.name); // Store the filename
//             } else {
//                 setUploadStatus(`Upload failed: ${data.error}`);
//                 setUploadedFileName(''); // Clear filename on error
//                 let errorMessage = 'Upload failed: ' + data.error;
//                 if (data.details) {
//                     errorMessage += '\n\nDetails: ' + data.details;
//                 }
//                 if (data.suggestions) {
//                     errorMessage += '\n\nSuggestions:\n' + data.suggestions.map((s: string) => '• ' + s).join('\n');
//                 }
//                 alert(errorMessage);
//             }
//         } catch (error) {
//             console.error('Upload error:', error);
//             setUploadStatus('Upload failed: Network error');
//             setUploadedFileName(''); // Clear filename on error
//             alert('Upload failed: ' + error);
//         } finally {
//             setUploading(false);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//         }
//     };
//
//     const handleAskQuestion = async () => {
//         if (!question.trim()) return;
//
//         setAskingQuestion(true);
//         try {
//             const response = await fetch('/api/ask-question', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ question }),
//             });
//
//             const data = await response.json();
//             setAnswer(data);
//         } catch (error) {
//             console.error('Question error:', error);
//             alert('Failed to get answer: ' + error);
//         } finally {
//             setAskingQuestion(false);
//         }
//     };
//
//     const getStatusIcon = () => {
//         switch (systemStatusType) {
//             case 'loading':
//                 return <Loader2 className="w-4 h-4 animate-spin" style={{ color: iconColor }} />;
//             case 'success':
//                 return <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />;
//             case 'error':
//                 return <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />;
//             default:
//                 return <Loader2 className="w-4 h-4 animate-spin" style={{ color: iconColor }} />;
//         }
//     };
//
//     const getStatusColor = () => {
//         switch (systemStatusType) {
//             case 'success':
//                 return '#22c55e';
//             case 'loading':
//                 return '#fbbf24';
//             case 'error':
//                 return '#ef4444';
//             default:
//                 return '#fbbf24';
//         }
//     };
//
//     return (
//         <>
//             <style jsx>{`
//                 @keyframes fadeIn {
//                     from { opacity: 0; transform: translateY(20px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//
//                 @keyframes spin {
//                     from { transform: rotate(0deg); }
//                     to { transform: rotate(360deg); }
//                 }
//             `}</style>
//
//             <div style={{
//                 minHeight: '100vh',
//                 background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0f1419 100%)',
//                 position: 'relative',
//                 overflow: 'hidden'
//             }}>
//                 {/* Animated Network Background */}
//                 <canvas
//                     ref={canvasRef}
//                     style={{
//                         position: 'fixed',
//                         top: 0,
//                         left: 0,
//                         width: '100%',
//                         height: '100%',
//                         zIndex: 1,
//                         pointerEvents: 'none'
//                     }}
//                 />
//
//                 {/* Main Content */}
//                 <div style={{
//                     position: 'relative',
//                     zIndex: 2,
//                     maxWidth: '700px',
//                     margin: '0 auto',
//                     padding: '30px 20px'
//                 }}>
//                     {/* Header */}
//                     <div style={{
//                         textAlign: 'center',
//                         marginBottom: '40px',
//                         animation: isVisible ? 'fadeIn 0.6s ease-out' : 'none'
//                     }}>
//                         <h1 style={{
//                             fontSize: 'clamp(2.5rem, 6vw, 4rem)',
//                             fontWeight: '800',
//                             background: 'linear-gradient(135deg, #00bfff 0%, #1e90ff 100%)',
//                             backgroundClip: 'text',
//                             WebkitBackgroundClip: 'text',
//                             color: 'transparent',
//                             marginBottom: '15px',
//                             textShadow: '0 0 20px rgba(0, 191, 255, 0.3)'
//                         }}>
//                             SCALABLE AI SEARCH
//                         </h1>
//                         <p style={{
//                             color: 'rgba(255,255,255,0.89)',
//                             fontSize: '1.1rem',
//                             margin: '0 auto 20px',
//                             lineHeight: '1.5'
//                         }}>
//                             AI understands meaning, so you get results that actually matter.
//                         </p>
//
//                         {/* Status */}
//                         <div style={{
//                             display: 'inline-flex',
//                             alignItems: 'center',
//                             gap: '8px',
//                             padding: '8px 16px',
//                             borderRadius: '20px',
//                             background: 'rgba(0, 0, 0, 0.6)',
//                             backdropFilter: 'blur(10px)',
//                             border: '1px solid rgba(0, 191, 255, 0.3)',
//                             color: getStatusColor(),
//                             fontSize: '13px',
//                             fontWeight: '500'
//                         }}>
//                             {getStatusIcon()}
//                             {systemStatus}
//                             {systemStatusType === 'error' && (
//                                 <button
//                                     onClick={checkSystemStatus}
//                                     style={{
//                                         padding: '4px 8px',
//                                         backgroundColor: 'transparent',
//                                         border: '1px solid currentColor',
//                                         borderRadius: '12px',
//                                         color: 'inherit',
//                                         fontSize: '11px',
//                                         cursor: 'pointer',
//                                         display: 'flex',
//                                         alignItems: 'center',
//                                         gap: '4px'
//                                     }}
//                                 >
//                                     <RefreshCw className="w-3 h-3" style={{ color: '#ef4444' }} />
//                                     Retry
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//
//                     {/* Upload Section */}
//                     <div style={{
//                         background: 'rgb(5,8,28)',
//                         backdropFilter: 'blur(20px)',
//                         borderRadius: '16px',
//                         border: '1px solid rgba(0, 191, 255, 0.2)',
//                         padding: '24px',
//                         marginBottom: '24px',
//                         animation: isVisible ? 'fadeIn 0.6s ease-out 0.1s both' : 'none'
//                     }}>
//                         <h2 style={{
//                             fontSize: '1.4rem',
//                             fontWeight: '600',
//                             marginBottom: '12px',
//                             color: 'white',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '8px'
//                         }}>
//                             <Folder className="w-5 h-5" style={{ color: iconColor }} />
//                             Upload Documents
//                         </h2>
//                         <p style={{
//                             color: 'rgba(255, 255, 255, 0.6)',
//                             marginBottom: '16px',
//                             fontSize: '0.95rem'
//                         }}>
//                             Upload PDF, DOCX, or TXT files
//                         </p>
//
//                         <div style={{ position: 'relative' }}>
//                             <input
//                                 ref={fileInputRef}
//                                 type="file"
//                                 accept=".pdf,.docx,.txt,.doc"
//                                 onChange={handleFileUpload}
//                                 disabled={uploading}
//                                 style={{
//                                     width: '100%',
//                                     padding: '14px',
//                                     border: '1px dashed rgba(0, 191, 255, 0.4)',
//                                     borderRadius: '10px',
//                                     backgroundColor: 'rgba(0, 191, 255, 0.05)',
//                                     color: 'white',
//                                     fontSize: '14px',
//                                     cursor: 'pointer'
//                                 }}
//                             />
//                             {uploading && (
//                                 <div style={{
//                                     position: 'absolute',
//                                     right: '14px',
//                                     top: '50%',
//                                     transform: 'translateY(-50%)',
//                                     color: iconColor,
//                                     fontSize: '13px',
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: '6px'
//                                 }}>
//                                     <Loader2 className="w-4 h-4 animate-spin" style={{ color: iconColor }} />
//                                     Processing...
//                                 </div>
//                             )}
//                         </div>
//
//                         {uploadStatus && (
//                             <div style={{
//                                 padding: '12px',
//                                 borderRadius: '8px',
//                                 background: uploadStatus.includes('successfully') ? 'rgba(34, 197, 94, 0.1)' : uploadStatus.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 191, 255, 0.1)',
//                                 border: '1px solid ' + (uploadStatus.includes('successfully') ? 'rgba(34, 197, 94, 0.3)' : uploadStatus.includes('failed') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 191, 255, 0.3)'),
//                                 color: uploadStatus.includes('successfully') ? '#22c55e' : uploadStatus.includes('failed') ? '#ef4444' : iconColor,
//                                 fontSize: '13px',
//                                 marginTop: '12px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '8px'
//                             }}>
//                                 {uploadStatus.includes('successfully') ?
//                                     <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} /> :
//                                     uploadStatus.includes('failed') ?
//                                         <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} /> :
//                                         <Upload className="w-4 h-4" style={{ color: iconColor }} />}
//                                 {uploadStatus}
//                             </div>
//                         )}
//
//                         {/* Display uploaded filename */}
//                         {uploadedFileName && (
//                             <div style={{
//                                 padding: '12px',
//                                 borderRadius: '8px',
//                                 background: 'rgba(0, 191, 255, 0.1)',
//                                 border: '1px solid rgba(0, 191, 255, 0.3)',
//                                 marginTop: '12px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '8px'
//                             }}>
//                                 <FileText className="w-4 h-4" style={{ color: iconColor }} />
//                                 <span style={{
//                                     color: 'rgba(255, 255, 255, 0.9)',
//                                     fontSize: '13px',
//                                     fontWeight: '500'
//                                 }}>
//                                     File: {uploadedFileName}
//                                 </span>
//                             </div>
//                         )}
//                     </div>
//
//                     {/* Question Section */}
//                     <div style={{
//                         background: 'rgb(5,8,28)',
//                         backdropFilter: 'blur(20px)',
//                         borderRadius: '16px',
//                         border: '1px solid rgba(0, 191, 255, 0.2)',
//                         padding: '24px',
//                         animation: isVisible ? 'fadeIn 0.6s ease-out 0.2s both' : 'none'
//                     }}>
//                         <h2 style={{
//                             fontSize: '1.4rem',
//                             fontWeight: '600',
//                             marginBottom: '12px',
//                             color: 'white',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '8px'
//                         }}>
//                             <MessageCircle className="w-5 h-5" style={{ color: iconColor }} />
//                             Ask Questions
//                         </h2>
//
//                         <div style={{
//                             display: 'flex',
//                             gap: '12px',
//                             marginBottom: '16px'
//                         }}>
//                             <input
//                                 type="text"
//                                 value={question}
//                                 onChange={(e) => setQuestion(e.target.value)}
//                                 onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
//                                 placeholder="Ask about your documents..."
//                                 style={{
//                                     flex: 1,
//                                     padding: '12px 16px',
//                                     border: '1px solid rgba(0, 191, 255, 0.3)',
//                                     borderRadius: '10px',
//                                     fontSize: '14px',
//                                     background: 'rgba(0, 191, 255, 0.05)',
//                                     color: 'white',
//                                     outline: 'none'
//                                 }}
//                             />
//                             <button
//                                 onClick={handleAskQuestion}
//                                 disabled={askingQuestion || !question.trim()}
//                                 style={{
//                                     background: askingQuestion || !question.trim() ? 'rgba(156, 163, 175, 0.3)' : 'linear-gradient(135deg, #00bfff 0%, #1e90ff 100%)',
//                                     color: 'white',
//                                     padding: '12px 20px',
//                                     borderRadius: '10px',
//                                     border: 'none',
//                                     cursor: askingQuestion || !question.trim() ? 'not-allowed' : 'pointer',
//                                     fontWeight: '500',
//                                     fontSize: '14px',
//                                     whiteSpace: 'nowrap',
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: '6px'
//                                 }}
//                             >
//                                 {askingQuestion ? (
//                                     <>
//                                         <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'white' }} />
//                                         Thinking...
//                                     </>
//                                 ) : (
//                                     <>
//                                         <Send className="w-4 h-4" style={{ color: 'white' }} />
//                                         Ask AI
//                                     </>
//                                 )}
//                             </button>
//                         </div>
//
//                         {/* Answer */}
//                         {answer && (
//                             <div style={{
//                                 background: 'rgba(0, 191, 255, 0.1)',
//                                 border: '1px solid rgba(0, 191, 255, 0.3)',
//                                 borderRadius: '12px',
//                                 padding: '16px',
//                                 marginTop: '16px'
//                             }}>
//                                 <h3 style={{
//                                     color: iconColor,
//                                     fontWeight: '600',
//                                     marginBottom: '8px',
//                                     fontSize: '1rem',
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: '8px'
//                                 }}>
//                                     <Bot className="w-5 h-5" style={{ color: iconColor }} />
//                                     AI Answer:
//                                 </h3>
//                                 <p style={{
//                                     color: 'rgba(255, 255, 255, 0.9)',
//                                     lineHeight: '1.6',
//                                     fontSize: '14px',
//                                     margin: 0
//                                 }}>
//                                     {answer.answer}
//                                 </p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }


// import { useState, useRef, useEffect } from 'react';
// import {
//     Loader2,
//     CheckCircle,
//     XCircle,
//     RefreshCw,
//     Upload,
//     Send,
//     FileText,
//     Sparkles,
//     Search,
//     ChevronRight,
//     Zap,
//     Database
// } from 'lucide-react';
//
// interface AskResult {
//     answer: string;
//     sources: Array<{
//         document: string;
//         similarity: string;
//         snippet: string;
//     }>;
//     question: string;
// }
//
// export default function SearchInterface() {
//     const [uploading, setUploading] = useState(false);
//     const [question, setQuestion] = useState('');
//     const [answer, setAnswer] = useState<AskResult | null>(null);
//     const [askingQuestion, setAskingQuestion] = useState(false);
//     const [uploadStatus, setUploadStatus] = useState<string>('');
//     const [uploadedFileName, setUploadedFileName] = useState<string>('');
//     const [systemStatus, setSystemStatus] = useState<string>('Checking system status...');
//     const [systemStatusType, setSystemStatusType] = useState<'loading' | 'success' | 'error'>('loading');
//     const fileInputRef = useRef<HTMLInputElement>(null);
//
//     const iconColor = '#6366f1';
//     const accentColor = '#8b5cf6';
//
//     useEffect(() => {
//         checkSystemStatus();
//     }, []);
//
//     const checkSystemStatus = async () => {
//         try {
//             setSystemStatus('Checking system status...');
//             setSystemStatusType('loading');
//
//             const ollamaResponse = await fetch('http://localhost:11434/api/tags');
//             const ollamaOk = ollamaResponse.ok;
//
//             const qdrantResponse = await fetch('http://localhost:6333/collections');
//             const qdrantOk = qdrantResponse.ok;
//
//             if (ollamaOk && qdrantOk) {
//                 setSystemStatus('All systems operational');
//                 setSystemStatusType('success');
//             } else if (!ollamaOk && !qdrantOk) {
//                 setSystemStatus('Services offline');
//                 setSystemStatusType('error');
//             } else if (!ollamaOk) {
//                 setSystemStatus('Ollama offline');
//                 setSystemStatusType('error');
//             } else {
//                 setSystemStatus('Qdrant offline');
//                 setSystemStatusType('error');
//             }
//         } catch (error) {
//             setSystemStatus('Connection failed');
//             setSystemStatusType('error');
//         }
//     };
//
//     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         if (file.size > 10 * 1024 * 1024) {
//             alert('File size must be less than 10MB');
//             return;
//         }
//
//         setUploading(true);
//         setUploadStatus('Processing document...');
//         setUploadedFileName('');
//
//         try {
//             const formData = new FormData();
//             formData.append('document', file);
//
//             const response = await fetch('/api/upload-document', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             const data = await response.json();
//
//             if (data.success) {
//                 setUploadStatus('Document indexed successfully');
//                 setUploadedFileName(file.name);
//             } else {
//                 setUploadStatus(`Upload failed: ${data.error}`);
//                 setUploadedFileName('');
//             }
//         } catch (error) {
//             console.error('Upload error:', error);
//             setUploadStatus('Upload failed');
//             setUploadedFileName('');
//         } finally {
//             setUploading(false);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//         }
//     };
//
//     const handleAskQuestion = async () => {
//         if (!question.trim()) return;
//
//         setAskingQuestion(true);
//         try {
//             const response = await fetch('/api/ask-question', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ question }),
//             });
//
//             const data = await response.json();
//             setAnswer(data);
//         } catch (error) {
//             console.error('Question error:', error);
//         } finally {
//             setAskingQuestion(false);
//         }
//     };
//
//     const suggestions = [
//         "Show me top 5 mobile developers",
//         "Find iOS engineers",
//         "Who has backend experience?",
//         "Cloud architects with AWS"
//     ];
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
//             {/* Header */}
//             <div className="border-b border-indigo-500/20 bg-slate-950/50 backdrop-blur-xl">
//                 <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
//                             <Sparkles className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                             <h1 className="text-xl font-bold text-white">Semantic Search AI</h1>
//                             <p className="text-xs text-indigo-300">Intelligent Document Analysis</p>
//                         </div>
//                     </div>
//
//                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-indigo-500/30">
//                         {systemStatusType === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
//                         {systemStatusType === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
//                         {systemStatusType === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
//                         <span className="text-xs text-white">{systemStatus}</span>
//                         {systemStatusType === 'error' && (
//                             <button onClick={checkSystemStatus} className="ml-2">
//                                 <RefreshCw className="w-3 h-3 text-indigo-400 hover:text-indigo-300" />
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//
//             {/* Main Content */}
//             <div className="max-w-6xl mx-auto px-6 py-12">
//                 <div className="grid lg:grid-cols-2 gap-8">
//                     {/* Left Column - Upload & Info */}
//                     <div className="space-y-6">
//                         {/* Upload Card */}
//                         <div className="bg-slate-900/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-2xl">
//                             <div className="flex items-center gap-3 mb-4">
//                                 <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
//                                     <Upload className="w-5 h-5 text-indigo-400" />
//                                 </div>
//                                 <div>
//                                     <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
//                                     <p className="text-sm text-slate-400">PDF, DOCX, or TXT files</p>
//                                 </div>
//                             </div>
//
//                             <label className="block">
//                                 <div className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group">
//                                     <input
//                                         ref={fileInputRef}
//                                         type="file"
//                                         accept=".pdf,.docx,.txt,.doc"
//                                         onChange={handleFileUpload}
//                                         disabled={uploading}
//                                         className="hidden"
//                                     />
//                                     <div className="flex flex-col items-center gap-3">
//                                         <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
//                                             <FileText className="w-6 h-6 text-indigo-400" />
//                                         </div>
//                                         <div>
//                                             <p className="text-white font-medium">Click to upload</p>
//                                             <p className="text-sm text-slate-400 mt-1">or drag and drop</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </label>
//
//                             {uploading && (
//                                 <div className="mt-4 flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
//                                     <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
//                                     <span className="text-sm text-indigo-200">Processing document...</span>
//                                 </div>
//                             )}
//
//                             {uploadStatus && !uploading && (
//                                 <div className={`mt-4 flex items-center gap-3 p-4 rounded-lg border ${
//                                     uploadStatus.includes('success')
//                                         ? 'bg-green-500/10 border-green-500/30'
//                                         : 'bg-red-500/10 border-red-500/30'
//                                 }`}>
//                                     {uploadStatus.includes('success')
//                                         ? <CheckCircle className="w-5 h-5 text-green-400" />
//                                         : <XCircle className="w-5 h-5 text-red-400" />
//                                     }
//                                     <span className={`text-sm ${uploadStatus.includes('success') ? 'text-green-200' : 'text-red-200'}`}>
//                                         {uploadStatus}
//                                     </span>
//                                 </div>
//                             )}
//
//                             {uploadedFileName && (
//                                 <div className="mt-4 flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
//                                     <FileText className="w-5 h-5 text-indigo-400" />
//                                     <span className="text-sm text-white truncate">{uploadedFileName}</span>
//                                 </div>
//                             )}
//                         </div>
//
//                         {/* Info Card */}
//                         <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6">
//                             <div className="flex items-center gap-2 mb-4">
//                                 <Zap className="w-5 h-5 text-yellow-400" />
//                                 <h3 className="text-lg font-semibold text-white">How it works</h3>
//                             </div>
//                             <div className="space-y-3">
//                                 <div className="flex items-start gap-3">
//                                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
//                                         <span className="text-xs font-bold text-indigo-300">1</span>
//                                     </div>
//                                     <p className="text-sm text-slate-300">Upload your documents - CVs, resumes, reports</p>
//                                 </div>
//                                 <div className="flex items-start gap-3">
//                                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
//                                         <span className="text-xs font-bold text-indigo-300">2</span>
//                                     </div>
//                                     <p className="text-sm text-slate-300">AI converts them into semantic vectors</p>
//                                 </div>
//                                 <div className="flex items-start gap-3">
//                                     <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
//                                         <span className="text-xs font-bold text-indigo-300">3</span>
//                                     </div>
//                                     <p className="text-sm text-slate-300">Ask natural questions and get intelligent answers</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Right Column - Search */}
//                     <div className="space-y-6">
//                         {/* Search Card */}
//                         <div className="bg-slate-900/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-2xl">
//                             <div className="flex items-center gap-3 mb-6">
//                                 <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
//                                     <Search className="w-5 h-5 text-purple-400" />
//                                 </div>
//                                 <div>
//                                     <h2 className="text-lg font-semibold text-white">Ask Questions</h2>
//                                     <p className="text-sm text-slate-400">Natural language search</p>
//                                 </div>
//                             </div>
//
//                             <div className="space-y-4">
//                                 <div className="flex gap-3">
//                                     <input
//                                         type="text"
//                                         value={question}
//                                         onChange={(e) => setQuestion(e.target.value)}
//                                         onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
//                                         placeholder="e.g., Show me mobile developers..."
//                                         className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
//                                     />
//                                     <button
//                                         onClick={handleAskQuestion}
//                                         disabled={askingQuestion || !question.trim()}
//                                         className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
//                                     >
//                                         {askingQuestion ? (
//                                             <>
//                                                 <Loader2 className="w-4 h-4 animate-spin" />
//                                                 <span>Searching...</span>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <Send className="w-4 h-4" />
//                                                 <span>Search</span>
//                                             </>
//                                         )}
//                                     </button>
//                                 </div>
//
//                                 {/* Suggestions */}
//                                 <div>
//                                     <p className="text-xs text-slate-400 mb-2">Try these:</p>
//                                     <div className="flex flex-wrap gap-2">
//                                         {suggestions.map((suggestion, idx) => (
//                                             <button
//                                                 key={idx}
//                                                 onClick={() => setQuestion(suggestion)}
//                                                 className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs text-slate-300 hover:text-white transition-all"
//                                             >
//                                                 {suggestion}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* Answer Card */}
//                         {answer && (
//                             <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
//                                 <div className="flex items-center gap-3 mb-4">
//                                     <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
//                                         <Sparkles className="w-5 h-5 text-indigo-300" />
//                                     </div>
//                                     <h3 className="text-lg font-semibold text-white">Answer</h3>
//                                 </div>
//                                 <p className="text-slate-200 leading-relaxed mb-4">{answer.answer}</p>
//
//                                 {answer.sources && answer.sources.length > 0 && (
//                                     <div className="border-t border-indigo-500/20 pt-4">
//                                         <div className="flex items-center gap-2 mb-3">
//                                             <Database className="w-4 h-4 text-indigo-400" />
//                                             <span className="text-sm font-medium text-indigo-300">Sources ({answer.sources.length})</span>
//                                         </div>
//                                         <div className="space-y-2">
//                                             {answer.sources.map((source, idx) => (
//                                                 <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
//                                                     <div className="flex items-start justify-between gap-2">
//                                                         <span className="text-sm text-slate-300 truncate">{source.document}</span>
//                                                         <span className="text-xs text-indigo-400 flex-shrink-0">{source.similarity}</span>
//                                                     </div>
//                                                     {source.snippet && (
//                                                         <p className="text-xs text-slate-400 mt-1 line-clamp-2">{source.snippet}</p>
//                                                     )}
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// import { useState, useRef, useEffect } from 'react';
// import {
//     Loader2,
//     CheckCircle,
//     XCircle,
//     RefreshCw,
//     Upload,
//     Send,
//     FileText,
//     Sparkles,
//     Search,
//     ChevronRight,
//     Zap,
//     Database,
//     Bot,
//     User,
//     FileUp,
//     MessageSquare,
//     Cpu,
//     Server,
//     Clock,
//     Trash2,
//     Download
// } from 'lucide-react';
// import DocumentList from '../components/DocumentList';
//
// interface AskResult {
//     answer: string;
//     sources: Array<{
//         document: string;
//         similarity: string;
//         snippet: string;
//     }>;
//     question: string;
//     timestamp?: number;
// }
//
// interface ChatHistoryItem {
//     id: string;
//     question: string;
//     answer: string;
//     sources: Array<{
//         document: string;
//         similarity: string;
//         snippet: string;
//     }>;
//     timestamp: number;
// }
//
// export default function SearchInterface() {
//     const [uploading, setUploading] = useState(false);
//     const [question, setQuestion] = useState('');
//     const [answer, setAnswer] = useState<AskResult | null>(null);
//     const [askingQuestion, setAskingQuestion] = useState(false);
//     const [uploadStatus, setUploadStatus] = useState<string>('');
//     const [uploadedFileName, setUploadedFileName] = useState<string>('');
//     const [systemStatus, setSystemStatus] = useState<string>('Checking system status...');
//     const [systemStatusType, setSystemStatusType] = useState<'loading' | 'success' | 'error'>('loading');
//     const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'history'>('search');
//     const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
//     const [selectedHistory, setSelectedHistory] = useState<ChatHistoryItem | null>(null);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//
//     const answerEndRef = useRef<HTMLDivElement>(null);
//
//     // Load chat history from localStorage on component mount
//     useEffect(() => {
//         const savedHistory = localStorage.getItem('chatHistory');
//         if (savedHistory) {
//             try {
//                 setChatHistory(JSON.parse(savedHistory));
//             } catch (error) {
//                 console.error('Error loading chat history:', error);
//             }
//         }
//     }, []);
//
//     // Save chat history to localStorage whenever it changes
//     useEffect(() => {
//         if (chatHistory.length > 0) {
//             localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
//         }
//     }, [chatHistory]);
//
//     useEffect(() => {
//         checkSystemStatus();
//     }, []);
//
//     useEffect(() => {
//         answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [answer, selectedHistory]);
//
//     const checkSystemStatus = async () => {
//         try {
//             setSystemStatus('Checking system status...');
//             setSystemStatusType('loading');
//
//             // Test Cohere API
//             let cohereOk = false;
//             try {
//                 const cohereTest = await fetch('/api/test-cohere');
//                 cohereOk = cohereTest.ok;
//             } catch (error) {
//                 console.error('Cohere test failed:', error);
//             }
//
//             // Test Qdrant
//             let qdrantOk = false;
//             try {
//                 const qdrantResponse = await fetch('http://localhost:6333/collections');
//                 qdrantOk = qdrantResponse.ok;
//             } catch (error) {
//                 console.error('Qdrant test failed:', error);
//             }
//
//             if (cohereOk && qdrantOk) {
//                 setSystemStatus('All systems operational');
//                 setSystemStatusType('success');
//             } else if (!cohereOk && !qdrantOk) {
//                 setSystemStatus('Services offline');
//                 setSystemStatusType('error');
//             } else if (!cohereOk) {
//                 setSystemStatus('Cohere API error - Check your API key');
//                 setSystemStatusType('error');
//             } else {
//                 setSystemStatus('Qdrant offline');
//                 setSystemStatusType('error');
//             }
//         } catch (error) {
//             setSystemStatus('Connection failed');
//             setSystemStatusType('error');
//         }
//     };
//
//     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         if (file.size > 10 * 1024 * 1024) {
//             alert('File size must be less than 10MB');
//             return;
//         }
//
//         setUploading(true);
//         setUploadStatus('Processing document...');
//         setUploadedFileName('');
//
//         try {
//             const formData = new FormData();
//             formData.append('document', file);
//
//             const response = await fetch('/api/upload-document', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             const data = await response.json();
//
//             if (data.success) {
//                 setUploadStatus('Document indexed successfully');
//                 setUploadedFileName(file.name);
//             } else {
//                 setUploadStatus(`Upload failed: ${data.error}`);
//                 setUploadedFileName('');
//             }
//         } catch (error) {
//             console.error('Upload error:', error);
//             setUploadStatus('Upload failed');
//             setUploadedFileName('');
//         } finally {
//             setUploading(false);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//         }
//     };
//
//     const handleAskQuestion = async () => {
//         if (!question.trim()) return;
//
//         setAskingQuestion(true);
//         try {
//             const response = await fetch('/api/ask-question', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ question }),
//             });
//
//             const data = await response.json();
//             const resultWithTimestamp = {
//                 ...data,
//                 timestamp: Date.now()
//             };
//             setAnswer(resultWithTimestamp);
//
//             // Add to chat history
//             const newHistoryItem: ChatHistoryItem = {
//                 id: Date.now().toString(),
//                 question: question,
//                 answer: data.answer,
//                 sources: data.sources || [],
//                 timestamp: Date.now()
//             };
//
//             setChatHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]); // Keep last 50 items
//             setSelectedHistory(null);
//
//         } catch (error) {
//             console.error('Question error:', error);
//         } finally {
//             setAskingQuestion(false);
//         }
//     };
//
//     const handleLoadHistory = (historyItem: ChatHistoryItem) => {
//         setSelectedHistory(historyItem);
//         setQuestion(historyItem.question);
//         setActiveTab('search');
//     };
//
//     const handleClearHistory = () => {
//         setChatHistory([]);
//         localStorage.removeItem('chatHistory');
//         setSelectedHistory(null);
//     };
//
//     const handleExportHistory = () => {
//         const historyData = JSON.stringify(chatHistory, null, 2);
//         const blob = new Blob([historyData], { type: 'application/json' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     };
//
//     const formatTimestamp = (timestamp: number) => {
//         return new Date(timestamp).toLocaleString();
//     };
//
//     const suggestions = [
//         "Show me top 5 mobile developers",
//         "Find iOS engineers with Swift experience",
//         "Who has backend experience with Node.js?",
//         "Cloud architects with AWS certification"
//     ];
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
//             {/* Enhanced Header */}
//             <div className="border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
//                 <div className="max-w-7xl mx-auto px-6 py-4">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-4">
//                             <div className="relative">
//                                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
//                                     <Bot className="w-6 h-6 text-white" />
//                                 </div>
//                                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
//                                     <div className="w-2 h-2 bg-white rounded-full"></div>
//                                 </div>
//                             </div>
//                             <div>
//                                 <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
//                                     SemanticSearch AI
//                                 </h1>
//                                 <p className="text-sm text-purple-300">Intelligent Document Analysis & Search</p>
//                             </div>
//                         </div>
//
//                         <div className="flex items-center gap-6">
//                             {/* Navigation Tabs */}
//                             <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700">
//                                 <button
//                                     onClick={() => setActiveTab('search')}
//                                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                                         activeTab === 'search'
//                                             ? 'bg-purple-500/20 text-white shadow-sm'
//                                             : 'text-slate-400 hover:text-white'
//                                     }`}
//                                 >
//                                     <Search className="w-4 h-4 inline mr-2" />
//                                     Search
//                                 </button>
//                                 <button
//                                     onClick={() => setActiveTab('upload')}
//                                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                                         activeTab === 'upload'
//                                             ? 'bg-purple-500/20 text-white shadow-sm'
//                                             : 'text-slate-400 hover:text-white'
//                                     }`}
//                                 >
//                                     <FileUp className="w-4 h-4 inline mr-2" />
//                                     Upload
//                                 </button>
//                                 <button
//                                     onClick={() => setActiveTab('history')}
//                                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                                         activeTab === 'history'
//                                             ? 'bg-purple-500/20 text-white shadow-sm'
//                                             : 'text-slate-400 hover:text-white'
//                                     }`}
//                                 >
//                                     <Clock className="w-4 h-4 inline mr-2" />
//                                     History
//                                 </button>
//                             </div>
//
//                             {/* System Status */}
//                             <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700">
//                                 <div className="flex items-center gap-2">
//                                     {systemStatusType === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
//                                     {systemStatusType === 'success' && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
//                                     {systemStatusType === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
//                                     <span className="text-sm text-white font-medium">{systemStatus}</span>
//                                 </div>
//                                 {systemStatusType === 'error' && (
//                                     <button
//                                         onClick={checkSystemStatus}
//                                         className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
//                                     >
//                                         <RefreshCw className="w-3 h-3 text-purple-400" />
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Main Content */}
//             <div className="max-w-7xl mx-auto px-6 py-8">
//                 <div className="grid lg:grid-cols-3 gap-8">
//                     {/* Left Sidebar */}
//                     <div className="lg:col-span-1 space-y-6">
//                         {/* Quick Stats */}
//                         <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
//                             <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
//                             <div className="space-y-4">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
//                                             <Cpu className="w-5 h-5 text-blue-400" />
//                                         </div>
//                                         <div>
//                                             <p className="text-sm text-slate-400">AI Model</p>
//                                             <p className="text-white font-medium">Ollama</p>
//                                         </div>
//                                     </div>
//                                     <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
//                                 </div>
//
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
//                                             <Database className="w-5 h-5 text-green-400" />
//                                         </div>
//                                         <div>
//                                             <p className="text-sm text-slate-400">Vector DB</p>
//                                             <p className="text-white font-medium">Qdrant</p>
//                                         </div>
//                                     </div>
//                                     <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* Quick Actions */}
//                         <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
//                             <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
//                             <div className="space-y-3">
//                                 <button
//                                     onClick={() => setActiveTab('upload')}
//                                     className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-all group"
//                                 >
//                                     <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
//                                         <Upload className="w-4 h-4 text-purple-400" />
//                                     </div>
//                                     <span className="text-white text-sm font-medium">Upload Documents</span>
//                                 </button>
//
//                                 <button
//                                     onClick={() => setActiveTab('history')}
//                                     className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-all group"
//                                 >
//                                     <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
//                                         <MessageSquare className="w-4 h-4 text-blue-400" />
//                                     </div>
//                                     <span className="text-white text-sm font-medium">Chat History</span>
//                                 </button>
//                             </div>
//                         </div>
//
//                         {/* Tips */}
//                         <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
//                             <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
//                                 <Zap className="w-5 h-5 text-yellow-400" />
//                                 Pro Tips
//                             </h3>
//                             <div className="space-y-3 text-sm text-slate-300">
//                                 <p>• Use specific keywords for better results</p>
//                                 <p>• Ask follow-up questions for deeper insights</p>
//                                 <p>• Upload multiple documents for comprehensive analysis</p>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Main Content Area */}
//                     <div className="lg:col-span-2 space-y-6">
//                         {/* Search/Upload/History Area */}
//                         {activeTab === 'search' && (
//                             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
//                                 <div className="flex items-center gap-3 mb-6">
//                                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
//                                         <Search className="w-6 h-6 text-white" />
//                                     </div>
//                                     <div>
//                                         <h2 className="text-xl font-bold text-white">Ask Your Documents</h2>
//                                         <p className="text-slate-400">Get intelligent answers from your uploaded content</p>
//                                     </div>
//                                 </div>
//
//                                 <div className="space-y-4">
//                                     <div className="flex gap-3">
//                                         <div className="flex-1 relative">
//                                             <input
//                                                 type="text"
//                                                 value={question}
//                                                 onChange={(e) => setQuestion(e.target.value)}
//                                                 onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
//                                                 placeholder="Ask something like: Show me developers with React experience..."
//                                                 className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-lg"
//                                             />
//                                         </div>
//                                         <button
//                                             onClick={handleAskQuestion}
//                                             disabled={askingQuestion || !question.trim()}
//                                             className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
//                                         >
//                                             {askingQuestion ? (
//                                                 <>
//                                                     <Loader2 className="w-5 h-5 animate-spin" />
//                                                     <span>Searching...</span>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <Send className="w-5 h-5" />
//                                                     <span>Ask AI</span>
//                                                 </>
//                                             )}
//                                         </button>
//                                     </div>
//
//                                     {/* Enhanced Suggestions */}
//                                     <div className="space-y-3">
//                                         <p className="text-sm text-slate-400 font-medium">Try asking:</p>
//                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                             {suggestions.map((suggestion, idx) => (
//                                                 <button
//                                                     key={idx}
//                                                     onClick={() => setQuestion(suggestion)}
//                                                     className="p-3 bg-slate-800/30 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-500/50 rounded-xl text-sm text-slate-300 hover:text-white transition-all text-left group"
//                                                 >
//                                                     <div className="flex items-center gap-2">
//                                                         <MessageSquare className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
//                                                         {suggestion}
//                                                     </div>
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//
//                         {activeTab === 'upload' && (
//                             /* Upload Interface */
//                             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
//                                 <div className="flex items-center gap-3 mb-6">
//                                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
//                                         <Upload className="w-6 h-6 text-white" />
//                                     </div>
//                                     <div>
//                                         <h2 className="text-xl font-bold text-white">Upload Documents</h2>
//                                         <p className="text-slate-400">Add PDF, DOCX, or TXT files for analysis</p>
//                                     </div>
//                                 </div>
//
//                                 <label className="block cursor-pointer">
//                                     <div className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
//                                         <input
//                                             ref={fileInputRef}
//                                             type="file"
//                                             accept=".pdf,.docx,.txt,.doc"
//                                             onChange={handleFileUpload}
//                                             disabled={uploading}
//                                             className="hidden"
//                                         />
//                                         <div className="flex flex-col items-center gap-4">
//                                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
//                                                 <FileUp className="w-8 h-8 text-white" />
//                                             </div>
//                                             <div>
//                                                 <p className="text-white font-semibold text-lg">Drop your files here</p>
//                                                 <p className="text-slate-400 mt-2">or click to browse</p>
//                                                 <p className="text-xs text-slate-500 mt-3">Supports: PDF, DOCX, TXT (Max 10MB)</p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </label>
//
//                                 {uploading && (
//                                     <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
//                                         <div className="flex items-center gap-3">
//                                             <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
//                                             <div className="flex-1">
//                                                 <p className="text-blue-200 font-medium">Processing document...</p>
//                                                 <p className="text-blue-300 text-sm">This may take a few moments</p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 {uploadStatus && !uploading && (
//                                     <div className={`mt-6 p-4 rounded-xl border ${
//                                         uploadStatus.includes('success')
//                                             ? 'bg-green-500/10 border-green-500/30'
//                                             : 'bg-red-500/10 border-red-500-30'
//                                     }`}>
//                                         <div className="flex items-center gap-3">
//                                             {uploadStatus.includes('success')
//                                                 ? <CheckCircle className="w-5 h-5 text-green-400" />
//                                                 : <XCircle className="w-5 h-5 text-red-400" />
//                                             }
//                                             <div>
//                                                 <p className={`font-medium ${uploadStatus.includes('success') ? 'text-green-200' : 'text-red-200'}`}>
//                                                     {uploadStatus}
//                                                 </p>
//                                                 {uploadedFileName && (
//                                                     <p className="text-sm text-green-300 mt-1">File: {uploadedFileName}</p>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//
//                         {activeTab === 'history' && (
//                             /* Chat History Interface */
//                             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
//                                 <div className="flex items-center justify-between mb-6">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
//                                             <Clock className="w-6 h-6 text-white" />
//                                         </div>
//                                         <div>
//                                             <h2 className="text-xl font-bold text-white">Chat History</h2>
//                                             <p className="text-slate-400">Your previous conversations and searches</p>
//                                         </div>
//                                     </div>
//                                     <div className="flex gap-2">
//                                         <button
//                                             onClick={handleExportHistory}
//                                             disabled={chatHistory.length === 0}
//                                             className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 hover:text-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                                         >
//                                             <Download className="w-4 h-4" />
//                                             Export
//                                         </button>
//                                         <button
//                                             onClick={handleClearHistory}
//                                             disabled={chatHistory.length === 0}
//                                             className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                                         >
//                                             <Trash2 className="w-4 h-4" />
//                                             Clear
//                                         </button>
//                                     </div>
//                                 </div>
//
//                                 {chatHistory.length === 0 ? (
//                                     <div className="text-center py-12">
//                                         <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
//                                         <h3 className="text-lg font-semibold text-slate-400 mb-2">No chat history yet</h3>
//                                         <p className="text-slate-500">Your questions and answers will appear here</p>
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4 max-h-[600px] overflow-y-auto">
//                                         {chatHistory.map((item) => (
//                                             <div
//                                                 key={item.id}
//                                                 onClick={() => handleLoadHistory(item)}
//                                                 className={`p-4 bg-slate-800/30 border rounded-xl cursor-pointer transition-all hover:border-purple-500/50 group ${
//                                                     selectedHistory?.id === item.id
//                                                         ? 'border-purple-500/50 bg-purple-500/10'
//                                                         : 'border-slate-700'
//                                                 }`}
//                                             >
//                                                 <div className="flex items-start justify-between mb-2">
//                                                     <p className="text-white font-medium line-clamp-2 flex-1">
//                                                         {item.question}
//                                                     </p>
//                                                     <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
//                                                         {formatTimestamp(item.timestamp)}
//                                                     </span>
//                                                 </div>
//                                                 <p className="text-slate-400 text-sm line-clamp-2">
//                                                     {item.answer}
//                                                 </p>
//                                                 {item.sources && item.sources.length > 0 && (
//                                                     <div className="flex items-center gap-1 mt-2">
//                                                         <Database className="w-3 h-3 text-purple-400" />
//                                                         <span className="text-xs text-purple-300">
//                                                             {item.sources.length} source{item.sources.length !== 1 ? 's' : ''}
//                                                         </span>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//
//                         {/* Answer Display */}
//                         {(answer || selectedHistory) && (
//                             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 space-y-6">
//                                 {/* Question */}
//                                 <div className="flex items-start gap-4">
//                                     <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
//                                         <User className="w-4 h-4 text-blue-400" />
//                                     </div>
//                                     <div className="flex-1">
//                                         <p className="text-white font-medium">
//                                             {selectedHistory ? selectedHistory.question : answer?.question}
//                                         </p>
//                                         {(selectedHistory || answer?.timestamp) && (
//                                             <p className="text-xs text-slate-500 mt-1">
//                                                 {formatTimestamp(selectedHistory ? selectedHistory.timestamp : answer!.timestamp!)}
//                                             </p>
//                                         )}
//                                     </div>
//                                 </div>
//
//                                 {/* Answer */}
//                                 <div className="flex items-start gap-4">
//                                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
//                                         <Bot className="w-4 h-4 text-white" />
//                                     </div>
//                                     <div className="flex-1 space-y-4">
//                                         <p className="text-slate-200 leading-relaxed text-lg">
//                                             {selectedHistory ? selectedHistory.answer : answer?.answer}
//                                         </p>
//
//                                         {/* Sources */}
//                                         {((selectedHistory?.sources && selectedHistory.sources.length > 0) ||
//                                             (answer?.sources && answer.sources.length > 0)) && (
//                                             <div className="border-t border-slate-700 pt-4 mt-4">
//                                                 <div className="flex items-center gap-2 mb-4">
//                                                     <Database className="w-5 h-5 text-purple-400" />
//                                                     <span className="text-purple-300 font-semibold">
//                                                         Sources ({(selectedHistory ? selectedHistory.sources : answer!.sources)!.length})
//                                                     </span>
//                                                 </div>
//                                                 <div className="grid gap-3">
//                                                     {(selectedHistory ? selectedHistory.sources : answer!.sources)!.map((source, idx) => (
//                                                         <div key={idx} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 hover:border-purple-500/30 transition-colors">
//                                                             <div className="flex items-start justify-between gap-4 mb-2">
//                                                                 <span className="text-white font-medium text-sm flex items-center gap-2">
//                                                                     <FileText className="w-4 h-4 text-purple-400" />
//                                                                     {source.document}
//                                                                 </span>
//                                                                 <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium flex-shrink-0">
//                                                                     {source.similarity}
//                                                                 </span>
//                                                             </div>
//                                                             {source.snippet && (
//                                                                 <p className="text-slate-400 text-sm leading-relaxed">{source.snippet}</p>
//                                                             )}
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                                 <div ref={answerEndRef} />
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
import { useState, useRef, useEffect } from 'react';
import {
    Loader2,
    CheckCircle,
    XCircle,
    RefreshCw,
    Upload,
    Send,
    FileText,
    Sparkles,
    Search,
    Zap,
    Database,
    Bot,
    User,
    FileUp,
    MessageSquare,
    Cpu,
    Clock,
    Trash2,
    Download,
    List,
    Cloud,
    Server,
    ChevronRight
} from 'lucide-react';

interface AskResult {
    answer: string;
    sources: Array<{
        document: string;
        similarity?: string;
        rerank_score?: string;
        vector_score?: string;
        snippet: string;
    }>;
    question: string;
    timestamp?: number;
    provider?: string;
    stats?: {
        initial?: number;
        reranked?: number;
        final?: number;
    };
}

interface ChatHistoryItem {
    id: string;
    question: string;
    answer: string;
    sources: Array<{
        document: string;
        similarity?: string;
        rerank_score?: string;
        snippet: string;
    }>;
    timestamp: number;
    provider?: string;
}

interface DocumentInfo {
    title: string;
    type: string;
    uploadedAt: string;
    chunksCount: number;
}

type ProviderType = 'ollama' | 'groq' | 'cohere' | 'jina' | 'openai-cohere';

export default function SearchInterface() {
    const [uploading, setUploading] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<AskResult | null>(null);
    const [askingQuestion, setAskingQuestion] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [systemStatus, setSystemStatus] = useState<string>('Checking system status...');
    const [systemStatusType, setSystemStatusType] = useState<'loading' | 'success' | 'error'>('loading');
    const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'history' | 'documents'>('search');
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<ChatHistoryItem | null>(null);
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState('');
    const [provider, setProvider] = useState<ProviderType>('ollama');
    const [groqApiKey, setGroqApiKey] = useState('');
    const [cohereApiKey, setCohereApiKey] = useState('');
    const [jinaApiKey, setJinaApiKey] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const answerEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            try {
                setChatHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (chatHistory.length > 0) {
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }, [chatHistory]);

    useEffect(() => {
        checkSystemStatus();
    }, []);

    useEffect(() => {
        answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [answer, selectedHistory]);

    useEffect(() => {
        if (activeTab === 'documents') {
            fetchDocuments();
        }
    }, [activeTab]);

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        try {
            const response = await fetch('/api/get-documents');
            const data = await response.json();
            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const deleteDocument = async (title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        setDeletingDoc(title);
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
        } catch (error) {
            alert('Delete failed: ' + error);
        } finally {
            setDeletingDoc('');
        }
    };

    const checkSystemStatus = async () => {
        try {
            setSystemStatus('Checking...');
            setSystemStatusType('loading');

            const ollamaResponse = await fetch('http://localhost:11434/api/tags');
            const ollamaOk = ollamaResponse.ok;

            const qdrantResponse = await fetch('http://localhost:6333/collections');
            const qdrantOk = qdrantResponse.ok;

            if (ollamaOk && qdrantOk) {
                setSystemStatus('All systems operational');
                setSystemStatusType('success');
            } else {
                setSystemStatus('Service offline');
                setSystemStatusType('error');
            }
        } catch (error) {
            setSystemStatus('Connection failed');
            setSystemStatusType('error');
        }
    };

    const getUploadEndpoint = () => {
        return '/api/upload-document';
    };

    const getAskEndpoint = () => {
        return '/api/ask-question';
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        setUploadStatus('Processing document...');
        setUploadedFileName('');

        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('provider', provider);

            if (provider === 'openai-cohere' && openaiApiKey) {
                formData.append('apiKey', openaiApiKey);
            }

            const response = await fetch(getUploadEndpoint(), {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success || data.message) {
                setUploadStatus('Document indexed successfully');
                setUploadedFileName(file.name);
                if (activeTab === 'documents') {
                    fetchDocuments();
                }
            } else {
                setUploadStatus(`Upload failed: ${data.error}`);
                setUploadedFileName('');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('Upload failed');
            setUploadedFileName('');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAskQuestion = async () => {
        if (!question.trim()) return;

        setAskingQuestion(true);
        try {
            const requestBody: any = { question };

            if (provider === 'openai-cohere') {
                requestBody.provider = 'openai-cohere';
                requestBody.openaiApiKey = openaiApiKey || process.env.OPENAI_API_KEY;
                requestBody.cohereApiKey = cohereApiKey || process.env.COHERE_API_KEY;
            } else if (provider === 'groq') {
                requestBody.provider = 'groq';
                requestBody.apiKey = groqApiKey || process.env.GROQ_API_KEY;
            } else if (provider === 'cohere') {
                requestBody.provider = 'cohere';
                requestBody.apiKey = cohereApiKey || process.env.COHERE_API_KEY;
            } else if (provider === 'jina') {
                requestBody.provider = 'jina';
                requestBody.apiKey = jinaApiKey || process.env.JINA_API_KEY;
            } else {
                requestBody.provider = 'ollama';
            }

            const response = await fetch(getAskEndpoint(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            const resultWithTimestamp = {
                ...data,
                timestamp: Date.now()
            };
            setAnswer(resultWithTimestamp);

            const newHistoryItem: ChatHistoryItem = {
                id: Date.now().toString(),
                question: question,
                answer: data.answer,
                sources: data.sources || [],
                timestamp: Date.now(),
                provider: data.provider || provider
            };

            setChatHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
            setSelectedHistory(null);

        } catch (error) {
            console.error('Question error:', error);
        } finally {
            setAskingQuestion(false);
        }
    };

    const handleLoadHistory = (historyItem: ChatHistoryItem) => {
        setSelectedHistory(historyItem);
        setQuestion(historyItem.question);
        setActiveTab('search');
    };

    const handleClearHistory = () => {
        if (!confirm('Clear all chat history?')) return;
        setChatHistory([]);
        localStorage.removeItem('chatHistory');
        setSelectedHistory(null);
    };

    const handleExportHistory = () => {
        const historyData = JSON.stringify(chatHistory, null, 2);
        const blob = new Blob([historyData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getProviderDisplayName = () => {
        switch (provider) {
            case 'ollama': return 'Ollama (Local)';
            case 'groq': return 'Groq (Cloud)';
            case 'cohere': return 'Cohere';
            case 'jina': return 'Jina AI';
            case 'openai-cohere': return 'OpenAI + Cohere';
            default: return 'Unknown';
        }
    };

    const suggestions = [
        "Show me top 5 mobile developers",
        "Find iOS engineers with Swift experience",
        "Who has backend experience with Node.js?",
        "Cloud architects with AWS certification"
    ];

    const providers = [
        {
            id: 'ollama',
            name: 'Ollama',
            icon: Server,
            subtitle: 'Local & Free',
            color: 'purple',
            needsKey: false
        },
        {
            id: 'groq',
            name: 'Groq',
            icon: Zap,
            subtitle: 'Ultra Fast',
            color: 'orange',
            needsKey: true,
            keyLabel: 'Groq API Key'
        },
        {
            id: 'cohere',
            name: 'Cohere',
            icon: Sparkles,
            subtitle: '1K calls/month',
            color: 'emerald',
            needsKey: true,
            keyLabel: 'Cohere API Key'
        },
        {
            id: 'jina',
            name: 'Jina',
            icon: Database,
            subtitle: '1M tokens/day',
            color: 'blue',
            needsKey: true,
            keyLabel: 'Jina API Key'
        },
        {
            id: 'openai-cohere',
            name: 'OpenAI+Cohere',
            icon: Cpu,
            subtitle: 'Hybrid Power',
            color: 'violet',
            needsKey: true,
            keyLabel: 'Both Keys'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.1);
                }
            `}</style>

            {/* Header */}
            <div className="border-b border-purple-200 glassmorphism sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-60"></div>
                                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-xl">
                                    <Sparkles className="w-7 h-7 text-white animate-pulse" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                                    SemanticSearch AI
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Navigation Tabs */}
                            <div className="flex gap-1 p-1.5 glassmorphism rounded-2xl border border-purple-200 shadow-lg">
                                {[
                                    { id: 'search', icon: Search, label: 'Search' },
                                    { id: 'upload', icon: FileUp, label: 'Upload' },
                                    { id: 'documents', icon: List, label: 'Docs' },
                                    { id: 'history', icon: Clock, label: 'History' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-300'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4 inline mr-2" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* System Status */}
                            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glassmorphism border border-purple-200 shadow-lg">
                                <div className="flex items-center gap-2.5">
                                    {systemStatusType === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                                    {systemStatusType === 'success' && (
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping"></div>
                                        </div>
                                    )}
                                    {systemStatusType === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                                    <span className="text-sm text-slate-700 font-bold">{systemStatus}</span>
                                </div>
                                {systemStatusType === 'error' && (
                                    <button
                                        onClick={checkSystemStatus}
                                        className="p-1.5 hover:bg-purple-100 rounded-lg transition-all"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Provider Selector */}
                        <div className="glassmorphism border border-purple-200 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-indigo-600" />
                                AI Provider
                            </h3>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {providers.map((prov) => {
                                    const Icon = prov.icon;
                                    const isSelected = provider === prov.id;
                                    return (
                                        <button
                                            key={prov.id}
                                            onClick={() => {
                                                setProvider(prov.id as ProviderType);
                                                setAnswer(null);
                                                setSelectedHistory(null);
                                            }}
                                            className={`relative overflow-hidden p-3 rounded-2xl border-2 transition-all duration-300 ${
                                                isSelected
                                                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="relative">
                                                <Icon className={`w-5 h-5 mx-auto mb-1 ${
                                                    isSelected ? 'text-purple-600' : 'text-gray-400'
                                                }`} />
                                                <div className={`text-xs font-bold ${
                                                    isSelected ? 'text-purple-900' : 'text-slate-800'
                                                }`}>{prov.name}</div>
                                                <div className={`text-[10px] mt-0.5 ${
                                                    isSelected ? 'text-purple-700' : 'text-slate-500'
                                                }`}>{prov.subtitle}</div>
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* API Key Inputs */}
                            {provider === 'groq' && (
                                <div className="space-y-3 animate-in slide-in-from-top duration-300">
                                    <input
                                        type="password"
                                        value={groqApiKey}
                                        onChange={(e) => setGroqApiKey(e.target.value)}
                                        placeholder="Enter Groq API Key"
                                        className="w-full px-4 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    />
                                    <a

                                    href="https://console.groq.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-xs text-orange-600 hover:text-orange-700 font-semibold"
                                    >
                                    Get free API key
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                                </div>
                                )}

                            {provider === 'cohere' && (
                                <div className="space-y-3 animate-in slide-in-from-top duration-300">
                                    <input
                                        type="password"
                                        value={cohereApiKey}
                                        onChange={(e) => setCohereApiKey(e.target.value)}
                                        placeholder="Enter Cohere API Key"
                                        className="w-full px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <a

                                    href="https://dashboard.cohere.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                                    >
                                    Get free API key
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                                </div>
                                )}

                            {provider === 'jina' && (
                                <div className="space-y-3 animate-in slide-in-from-top duration-300">
                                    <input
                                        type="password"
                                        value={jinaApiKey}
                                        onChange={(e) => setJinaApiKey(e.target.value)}
                                        placeholder="Enter Jina API Key"
                                        className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <a

                                    href="https://jina.ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                    Get free API key
                                    <ChevronRight className="w-3 h-3" />
                                </a>
                                </div>
                                )}

                            {provider === 'openai-cohere' && (
                                <div className="space-y-3 animate-in slide-in-from-top duration-300">
                                    <input
                                        type="password"
                                        value={openaiApiKey}
                                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                                        placeholder="OpenAI API Key"
                                        className="w-full px-4 py-2.5 bg-white border-2 border-violet-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                    />
                                    <input
                                        type="password"
                                        value={cohereApiKey}
                                        onChange={(e) => setCohereApiKey(e.target.value)}
                                        placeholder="Cohere API Key"
                                        className="w-full px-4 py-2.5 bg-white border-2 border-violet-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                    />
                                    <div className="flex gap-2 text-xs">
                                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 bg-violet-50 border border-violet-200 rounded-lg text-violet-600 hover:text-violet-700 font-semibold">
                                            OpenAI Key
                                        </a>
                                        <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 bg-violet-50 border border-violet-200 rounded-lg text-violet-600 hover:text-violet-700 font-semibold">
                                            Cohere Key
                                        </a>
                                    </div>
                                    <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                                        <p className="text-xs text-violet-700 font-semibold">
                                            OpenAI embeddings + Cohere rerank = Best results
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                <p className="text-xs text-indigo-700 font-bold flex items-center justify-between">
                                    <span>Active: {getProviderDisplayName()}</span>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                </p>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="glassmorphism border border-purple-200 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <Database className="w-5 h-5 text-indigo-600" />
                                System Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                            <Cpu className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold">AI Engine</p>
                                            <p className="text-slate-800 font-bold text-sm">{getProviderDisplayName()}</p>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-ping`}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                            <Database className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold">Vector DB</p>
                                            <p className="text-slate-800 font-bold text-sm">Qdrant</p>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        <div className={`w-3 h-3 rounded-full ${systemStatusType === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-ping`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tips */}
                        <div className="glassmorphism border border-amber-200 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-full blur-2xl"></div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
                                <Zap className="w-5 h-5 text-amber-600" />
                                Pro Tips
                            </h3>
                            <div className="space-y-3 text-sm text-slate-600 relative z-10">
                                <div className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                    <p className="font-medium">Groq is 10x faster than Ollama</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                    <p className="font-medium">OpenAI+Cohere hybrid gives best accuracy</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                    <p className="font-medium">Use specific keywords for better matching</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === 'search' && (
                            <div className="glassmorphism border border-purple-200 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur-lg opacity-60"></div>
                                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                            <Search className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Ask Your Documents</h2>
                                        <p className="text-slate-600 mt-1 font-medium">Get intelligent answers from your content</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                                                placeholder="Ask something about your documents..."
                                                className="relative w-full px-6 py-5 bg-white border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-100 text-lg transition-all shadow-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAskQuestion}
                                            disabled={askingQuestion || !question.trim()}
                                            className="px-8 py-5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                            {askingQuestion ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Thinking...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    <span>Ask AI</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div>
                                        <p className="text-sm text-slate-600 font-bold mb-4">Suggested questions:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {suggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setQuestion(suggestion)}
                                                    className="p-4 bg-white border border-gray-200 hover:border-purple-300 rounded-xl text-sm text-slate-600 hover:text-slate-800 transition-all text-left group hover:shadow-md"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Sparkles className="w-4 h-4 text-purple-500 group-hover:rotate-12 transition-transform" />
                                                        <span className="flex-1 font-medium">{suggestion}</span>
                                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Answer Display */}
                        {(answer || selectedHistory) && (
                            <div className="glassmorphism border border-purple-200 rounded-3xl p-8 shadow-xl space-y-8 animate-in slide-in-from-bottom duration-500">
                                {answer?.stats && (
                                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-violet-700 font-bold">2-Stage Retrieval:</span>
                                            <span className="text-violet-600">{answer.stats.initial} candidates → {answer.stats.reranked} reranked → {answer.stats.final} final</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-800 font-bold text-lg mb-2">
                                            {selectedHistory ? selectedHistory.question : answer?.question}
                                        </p>
                                        {(selectedHistory || answer?.timestamp) && (
                                            <p className="text-xs text-slate-400 font-semibold">
                                                {formatTimestamp(selectedHistory ? selectedHistory.timestamp : answer!.timestamp!)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur-lg opacity-50"></div>
                                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        {(() => {
                                            const sources = selectedHistory ? selectedHistory.sources : answer?.sources || [];

                                            if (sources.length === 0) {
                                                return (
                                                    <p className="text-slate-700 leading-relaxed text-lg font-medium">
                                                        {selectedHistory ? selectedHistory.answer : answer?.answer}
                                                    </p>
                                                );
                                            }

                                            return (
                                                <>
                                                    <p className="text-slate-700 leading-relaxed text-lg font-medium mb-6">
                                                        Here are the top {sources.length} candidates matching your search:
                                                    </p>

                                                    <div className="grid gap-4">
                                                        {sources.map((source, idx) => {
                                                            const percentage = source.similarity
                                                                ? (parseFloat(source.similarity) * 100).toFixed(1)
                                                                : '0.0';

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl p-6"
                                                                >
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                                                #{idx + 1}
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                                                    <FileText className="w-5 h-5 text-purple-600" />
                                                                                    {source.document}
                                                                                </h3>
                                                                                <p className="text-xs text-slate-500 font-semibold mt-1">
                                                                                    Candidate Profile
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="relative">
                                                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl blur-md opacity-60"></div>
                                                                            <div className="relative px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                                                                                <div className="text-center">
                                                                                    <div className="text-2xl font-black text-white leading-none">
                                                                                        {percentage}%
                                                                                    </div>
                                                                                    <div className="text-[10px] text-emerald-100 font-bold uppercase tracking-wide">
                                                                                        Match
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {source.rerank_score && (
                                                                        <div className="mb-4 flex gap-2">
                                                                            <span className="px-3 py-1 bg-violet-100 border border-violet-300 text-violet-700 rounded-lg text-xs font-bold">
                                                                                Rerank: {(parseFloat(source.rerank_score) * 100).toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-1000"
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>

                                                                    {source.snippet && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                                                {source.snippet}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent rounded-full blur-3xl opacity-20 -z-10"></div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div ref={answerEndRef} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

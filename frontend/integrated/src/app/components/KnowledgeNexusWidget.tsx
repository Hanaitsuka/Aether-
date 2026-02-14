import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Youtube, FileText, X, Plus, Maximize, Link as LinkIcon, Upload } from "lucide-react";

interface KnowledgeNexusWidgetProps {
  mode: '3d' | '2d';
}

type PDFFile = {
  id: string;
  name: string;
  url: string;
  pages: number;
};

export function KnowledgeNexusWidget({ mode }: KnowledgeNexusWidgetProps) {
  const [showYouTube, setShowYouTube] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [currentYoutubeId, setCurrentYoutubeId] = useState("");
  const [isYoutubeFullscreen, setIsYoutubeFullscreen] = useState(false);
  
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeSubmit = () => {
    const videoId = extractYoutubeId(youtubeUrl);
    if (videoId) {
      setCurrentYoutubeId(videoId);
      setShowYouTube(true);
      setYoutubeUrl("");
    } else {
      alert("Please enter a valid YouTube URL");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          const newPdf: PDFFile = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            url: url,
            pages: Math.floor(Math.random() * 50) + 10, // Mock page count
          };
          setPdfFiles(prev => [...prev, newPdf]);
        }
      });
    }
  };

  const removePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(pdf => pdf.id !== id));
    if (selectedPdf?.id === id) {
      setSelectedPdf(null);
    }
  };

  const toggleYoutubeFullscreen = () => {
    if (!isYoutubeFullscreen && youtubeContainerRef.current) {
      if (youtubeContainerRef.current.requestFullscreen) {
        youtubeContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    setIsYoutubeFullscreen(!isYoutubeFullscreen);
  };

  const togglePdfFullscreen = () => {
    if (!isPdfFullscreen && pdfContainerRef.current) {
      if (pdfContainerRef.current.requestFullscreen) {
        pdfContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    setIsPdfFullscreen(!isPdfFullscreen);
  };

  return (
    <div className={`backdrop-blur-2xl rounded-3xl p-6 border ${
      mode === '3d'
        ? 'bg-black/30 border-amber-500/30 shadow-2xl shadow-black/50'
        : 'bg-white/60 border-teal-400/40 shadow-xl'
    }`}>
      <h2 className={`text-xl mb-6 ${
        mode === '3d' ? 'font-serif text-amber-200' : 'font-sans text-teal-700'
      }`}>
        Knowledge Nexus
      </h2>

      {/* Add YouTube/PDF Buttons */}
      <div className="flex gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowYouTube(!showYouTube)}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
            showYouTube
              ? mode === '3d'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-teal-500 text-white shadow-lg'
              : mode === '3d'
                ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/50 border border-amber-500/20'
                : 'bg-teal-100 text-teal-600 hover:bg-teal-200 border border-teal-300'
          }`}
        >
          <Youtube className="w-5 h-5" />
          {showYouTube ? 'Hide YouTube' : 'Add YouTube'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
            mode === '3d'
              ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/50 border border-amber-500/20'
              : 'bg-teal-100 text-teal-600 hover:bg-teal-200 border border-teal-300'
          }`}
        >
          <Upload className="w-5 h-5" />
          Upload PDF
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* YouTube Section */}
      <AnimatePresence>
        {showYouTube && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            {!currentYoutubeId ? (
              <div className={`rounded-2xl p-4 ${
                mode === '3d'
                  ? 'bg-amber-900/30 border border-amber-500/20'
                  : 'bg-teal-50 border-2 border-teal-300'
              }`}>
                <label className={`block text-sm mb-2 ${
                  mode === '3d' ? 'text-amber-200' : 'text-teal-700'
                }`}>
                  YouTube Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      mode === '3d'
                        ? 'bg-amber-950/50 border border-amber-500/20 text-amber-100 placeholder:text-amber-400/40'
                        : 'bg-white border-2 border-teal-300 text-teal-900 placeholder:text-teal-400'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleYoutubeSubmit}
                    className={`px-6 py-2 rounded-lg ${
                      mode === '3d'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-teal-500 text-white shadow-lg'
                    }`}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div
                ref={youtubeContainerRef}
                className={`rounded-2xl overflow-hidden relative ${
                  mode === '3d'
                    ? 'border-2 border-amber-500/20'
                    : 'border-4 border-teal-300'
                }`}
              >
                <div className="aspect-video bg-black relative">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${currentYoutubeId}?autoplay=1`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0"
                  ></iframe>
                </div>

                {/* Controls */}
                <div className={`p-3 flex items-center justify-between ${
                  mode === '3d' ? 'bg-amber-900/30' : 'bg-teal-50'
                }`}>
                  <div className={`text-sm ${mode === '3d' ? 'text-amber-100' : 'text-teal-900'}`}>
                    YouTube Video
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleYoutubeFullscreen}
                      className={`p-2 rounded-full transition-colors ${
                        mode === '3d' ? 'hover:bg-amber-500/20 text-amber-300' : 'hover:bg-teal-200 text-teal-600'
                      }`}
                    >
                      <Maximize className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCurrentYoutubeId("");
                        setShowYouTube(false);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        mode === '3d' ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-red-200 text-red-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Section */}
      {selectedPdf ? (
        <div
          ref={pdfContainerRef}
          className={`rounded-2xl overflow-hidden ${
            mode === '3d'
              ? 'border-2 border-amber-500/20'
              : 'border-4 border-pink-300'
          }`}
        >
          <div className="bg-gray-900 h-[500px] relative">
            <iframe
              src={selectedPdf.url}
              className="w-full h-full"
              title={selectedPdf.name}
            ></iframe>
          </div>

          {/* PDF Controls */}
          <div className={`p-3 flex items-center justify-between ${
            mode === '3d' ? 'bg-amber-900/30' : 'bg-pink-50'
          }`}>
            <div>
              <div className={`text-sm ${mode === '3d' ? 'text-amber-100' : 'text-pink-900'}`}>
                {selectedPdf.name}
              </div>
              <div className={`text-xs ${mode === '3d' ? 'text-amber-300/60' : 'text-pink-700/60'}`}>
                {selectedPdf.pages} pages
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePdfFullscreen}
                className={`p-2 rounded-full transition-colors ${
                  mode === '3d' ? 'hover:bg-amber-500/20 text-amber-300' : 'hover:bg-pink-200 text-pink-600'
                }`}
              >
                <Maximize className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPdf(null)}
                className={`p-2 rounded-full transition-colors ${
                  mode === '3d' ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-red-200 text-red-600'
                }`}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl p-6 min-h-[400px] ${
          mode === '3d'
            ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-amber-500/20'
            : 'bg-gradient-to-br from-pink-50 to-purple-50 border-4 border-pink-300'
        }`}>
          {pdfFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className={`w-16 h-16 mb-4 ${
                mode === '3d' ? 'text-amber-300/40' : 'text-pink-300'
              }`} />
              <p className={`text-lg mb-2 ${
                mode === '3d' ? 'text-amber-200' : 'text-pink-700'
              }`}>
                No PDFs uploaded yet
              </p>
              <p className={`text-sm ${
                mode === '3d' ? 'text-amber-300/60' : 'text-pink-600/60'
              }`}>
                Upload PDF files from your device to study
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`text-sm mb-4 ${
                mode === '3d' ? 'text-amber-200' : 'text-pink-700'
              }`}>
                Your Documents ({pdfFiles.length})
              </div>
              {pdfFiles.map((pdf) => (
                <motion.div
                  key={pdf.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    mode === '3d'
                      ? 'bg-amber-800/30 hover:bg-amber-800/50 border border-amber-600/20'
                      : 'bg-white border-2 border-pink-200 hover:border-pink-400'
                  }`}
                  onClick={() => setSelectedPdf(pdf)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      mode === '3d'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-pink-400 to-purple-500'
                    }`}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className={`text-sm ${mode === '3d' ? 'text-amber-100' : 'text-pink-900'}`}>
                        {pdf.name}
                      </div>
                      <div className={`text-xs ${mode === '3d' ? 'text-amber-300/60' : 'text-pink-700/60'}`}>
                        {pdf.pages} pages
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePdf(pdf.id);
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      mode === '3d'
                        ? 'hover:bg-red-500/20 text-red-300'
                        : 'hover:bg-red-200 text-red-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

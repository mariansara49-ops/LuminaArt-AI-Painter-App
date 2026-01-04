
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArtModel, 
  AspectRatio, 
  GeneratedArt, 
  ImageSize, 
  ArtGenerationOptions 
} from './types';
import { generateArt, checkAndRequestProKey } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';
import ArtCard from './components/ArtCard';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ArtModel>(ArtModel.FLASH);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [sourceImage, setSourceImage] = useState<{data: string, type: string} | null>(null);
  const [gallery, setGallery] = useState<GeneratedArt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load gallery from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lumina_gallery');
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse gallery");
      }
    }
  }, []);

  // Save gallery to localStorage
  useEffect(() => {
    localStorage.setItem('lumina_gallery', JSON.stringify(gallery));
  }, [gallery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage({
          data: (reader.result as string).split(',')[1],
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSourceImage = () => {
    setSourceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !sourceImage) {
      setError("Please provide a text prompt or an image to start painting.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // For PRO models, mandatory key check before proceeding
      await checkAndRequestProKey(model);

      const options: ArtGenerationOptions = {
        prompt: prompt || "Paint something beautiful based on this image",
        model,
        aspectRatio,
        imageSize: model === ArtModel.PRO ? imageSize : undefined,
        sourceImageBase64: sourceImage?.data,
        mimeType: sourceImage?.type
      };

      const result = await generateArt(options);
      
      const newArt: GeneratedArt = {
        id: Date.now().toString(),
        url: result.imageUrl,
        prompt: prompt || "AI Stylized Image",
        model,
        timestamp: Date.now(),
        aspectRatio,
        sourceImage: sourceImage ? `data:${sourceImage.type};base64,${sourceImage.data}` : undefined
      };

      setGallery(prev => [newArt, ...prev]);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("permission") || msg.includes("403")) {
        setError("Permission Denied: This usually means you need to select a valid API key with billing enabled for this model.");
      } else {
        setError(msg || "Failed to generate art. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteArt = (id: string) => {
    setGallery(prev => prev.filter(art => art.id !== id));
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-purple-500/30">
      {isGenerating && <LoadingOverlay />}

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <i className="fas fa-wand-sparkles text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-outfit font-extrabold tracking-tight">
              Lumina<span className="gradient-text">Art</span>
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button onClick={openKeySelection} className="hover:text-white transition-colors flex items-center gap-2">
              <i className="fas fa-key text-xs"></i> Select API Key
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-white transition-colors flex items-center gap-2">
              <i className="fas fa-credit-card text-xs"></i> Billing Info
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Intro Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-outfit font-black mb-4 leading-tight">
            The Canvas of <span className="gradient-text">Artificial Intelligence</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Transform simple words and photos into professional-grade digital art using Gemini's most powerful visual models.
          </p>
        </div>

        {/* Studio Panel */}
        <div className="grid lg:grid-cols-12 gap-8 items-start mb-20">
          
          {/* Controls */}
          <section className="lg:col-span-5 glass-panel rounded-3xl p-6 lg:p-8 space-y-8 shadow-xl">
            
            {/* Model Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Engine Mode</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-800/50 rounded-xl">
                <button 
                  onClick={() => setModel(ArtModel.FLASH)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all ${model === ArtModel.FLASH ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="flex items-center gap-2"><i className="fas fa-bolt text-[10px]"></i> Flash</span>
                  <span className="text-[9px] opacity-60 font-normal">Fast & Light</span>
                </button>
                <button 
                  onClick={() => {
                    setModel(ArtModel.PRO);
                    openKeySelection();
                  }}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition-all ${model === ArtModel.PRO ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className="flex items-center gap-2"><i className="fas fa-crown text-[10px]"></i> Pro</span>
                  <span className="text-[9px] opacity-80 font-normal">High Quality (Paid Key)</span>
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Art Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your masterpiece... (e.g., 'A cyberpunk street at night, neon reflections in puddles, cinematic lighting, 8k')"
                className="w-full h-32 bg-slate-900/50 border border-white/5 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              />
            </div>

            {/* Source Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Base Image (Optional)</label>
              {!sourceImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer border-2 border-dashed border-slate-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 bg-slate-900/20 hover:bg-slate-900/40"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-image text-slate-400 group-hover:text-purple-400"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">Click to upload photo</p>
                    <p className="text-xs text-slate-500 mt-1">AI will paint based on this image</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900">
                  <img 
                    src={`data:${sourceImage.type};base64,${sourceImage.data}`} 
                    className="w-full h-full object-cover opacity-50" 
                    alt="Source" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <button 
                      onClick={removeSourceImage}
                      className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      <i className="fas fa-times mr-2"></i> Remove
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3 Desktop</option>
                  <option value="16:9">16:9 Cinema</option>
                  <option value="3:4">3:4 Portrait</option>
                  <option value="9:16">9:16 Story</option>
                </select>
              </div>
              {model === ArtModel.PRO && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Resolution</label>
                  <select 
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as ImageSize)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="1K">1K Standard</option>
                    <option value="2K">2K Sharp</option>
                    <option value="4K">4K Ultra HD</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <i className="fas fa-circle-exclamation text-red-400 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm text-red-200 font-bold mb-1">Generation Error</p>
                  <p className="text-xs text-red-200/80">{error}</p>
                  {error.includes("Permission") && (
                    <button 
                      onClick={openKeySelection}
                      className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/40 text-white px-3 py-1 rounded-md transition-colors font-bold"
                    >
                      Update API Key
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-outfit font-black text-lg shadow-xl shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="flex items-center justify-center gap-3">
                <i className="fas fa-magic group-hover:rotate-12 transition-transform"></i>
                GENERATE ARTWORK
              </span>
            </button>
          </section>

          {/* Preview Area */}
          <section className="lg:col-span-7">
            {gallery.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-outfit font-bold">Latest Masterpiece</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = gallery[0].url;
                        link.download = `lumina-art-${gallery[0].id}.png`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      <i className="fas fa-download mr-2"></i> Download
                    </button>
                  </div>
                </div>
                <div className="relative glass-panel rounded-[2.5rem] p-4 overflow-hidden shadow-2xl">
                  <div className="aspect-square bg-slate-900 rounded-[2rem] overflow-hidden">
                    <img 
                      src={gallery[0].url} 
                      alt="Latest creation" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-slate-400 text-sm italic font-medium">"{gallery[0].prompt}"</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><i className="fas fa-microchip"></i> {gallery[0].model}</span>
                      <span className="flex items-center gap-1"><i className="fas fa-expand"></i> {gallery[0].aspectRatio}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-panel rounded-[2.5rem] border-dashed border-white/5 p-12 text-center opacity-40">
                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                  <i className="fas fa-brush text-4xl text-slate-600"></i>
                </div>
                <h3 className="text-2xl font-outfit font-bold text-slate-500">The canvas is blank</h3>
                <p className="text-slate-600 mt-2 max-w-xs">Enter a prompt and hit generate to see your first AI painting appear here.</p>
                <button onClick={openKeySelection} className="mt-6 text-xs text-purple-400 font-bold hover:underline">
                  Connect your API key first
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Gallery Section */}
        {gallery.length > 1 && (
          <section className="mb-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h3 className="text-3xl font-outfit font-black tracking-tight">Your <span className="gradient-text">Artistic Legacy</span></h3>
                <p className="text-slate-500 mt-1">Previously generated masterpieces</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to clear your entire gallery?")) {
                    setGallery([]);
                  }
                }}
                className="text-slate-500 hover:text-red-400 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <i className="fas fa-trash-can"></i> CLEAR ALL
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.slice(1).map(art => (
                <ArtCard key={art.id} art={art} onDelete={deleteArt} />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="mt-auto border-t border-white/5 py-10 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <p className="text-sm">© 2024 LuminaArt Studio. Powered by Gemini Pro.</p>
          <div className="flex items-center gap-6 text-xl">
            <a href="#" className="hover:text-purple-400 transition-colors"><i className="fab fa-instagram"></i></a>
            <a href="#" className="hover:text-purple-400 transition-colors"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-purple-400 transition-colors"><i className="fab fa-discord"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

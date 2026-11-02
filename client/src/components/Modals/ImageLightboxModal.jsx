import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ImageLightboxModal = () => {
  const { lightboxImage, setLightboxImage } = useChat();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, setLightboxImage]);

  if (!lightboxImage) return null;

  return (
    <div
      onClick={() => setLightboxImage(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      {/* Top action bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
      >
        <a
          href={lightboxImage}
          download="chatboat-media"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          title="Download image"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={() => setLightboxImage(null)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl animate-scale-up"
      >
        <img
          src={lightboxImage}
          alt="Zoomed media"
          className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
};

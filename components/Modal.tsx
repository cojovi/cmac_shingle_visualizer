import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'roof_visualization.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-4 max-w-4xl max-h-full overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors z-10 bg-gray-900 rounded-full p-1"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img src={imageUrl} alt="Generated roof visualization" className="max-w-full max-h-[80vh] object-contain rounded-md" />
        <div className="mt-4 text-center">
            <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center bg-[#ED2C29] hover:bg-[#C02248] text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out"
            >
                <DownloadIcon />
                Download Image
            </button>
        </div>
      </div>
    </div>
  );
};

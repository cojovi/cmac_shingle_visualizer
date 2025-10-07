import React from 'react';

interface ResultDisplayProps {
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  onEnlarge: (url: string) => void;
}

const Placeholder: React.FC = () => (
    <div className="w-full h-full min-h-[20rem] bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm">Your visualization will appear here</p>
    </div>
);

const EnlargeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImageUrl, generatedImageUrl, onEnlarge }) => {
  if (!generatedImageUrl && !originalImageUrl) {
    return <Placeholder />;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center text-gray-200">Visualization Result</h3>
      {generatedImageUrl && originalImageUrl ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <h4 className="text-center font-medium text-gray-300 mb-2">Before</h4>
                <img src={originalImageUrl} alt="Original house" className="w-full h-auto object-contain rounded-lg shadow-md" />
            </div>
            <div className="relative group">
                <h4 className="text-center font-medium text-gray-300 mb-2">After</h4>
                <img src={generatedImageUrl} alt="House with new roof" className="w-full h-auto object-contain rounded-lg shadow-md" />
                 <div 
                    onClick={() => onEnlarge(generatedImageUrl)}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center cursor-pointer rounded-lg"
                    aria-label="Enlarge image"
                    role="button"
                >
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full">
                        <EnlargeIcon />
                        <span>Enlarge</span>
                    </div>
                </div>
            </div>
        </div>
      ) : originalImageUrl && !generatedImageUrl ? (
        <div>
            <h4 className="text-center font-medium text-gray-300 mb-2">Original Image</h4>
            <img src={originalImageUrl} alt="Original house" className="w-full h-auto object-contain rounded-lg shadow-md" />
        </div>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
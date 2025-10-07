import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex flex-col items-center justify-center z-10 rounded-lg">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-300 font-semibold">Generating your new roof...</p>
    </div>
  );
};

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { generateRoofImage } from './services/geminiService';
import type { UploadedFile } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { Modal } from './components/Modal';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<UploadedFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage({
      file,
      url: URL.createObjectURL(file),
    });
    setGeneratedImage(null);
    setError(null);
  }, []);

  const handleSubmit = async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide a roof description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Data = await fileToBase64(originalImage.file);
      
      const result = await generateRoofImage(base64Data, originalImage.file.type, prompt);
      if (result) {
        setGeneratedImage(result);
      } else {
        setError('Could not generate the image. The model may not have returned an image.');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while generating the image. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
    setIsLoading(false);
  };

  const handleOpenModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{color: '#284889'}}>
              Roofing Visualization Engine
            </h1>
            <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
              Upload a photo of a house, describe your desired roofing material, and let our AI create a photorealistic visualization of the result.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col gap-6">
                <ImageUploader onImageUpload={handleImageUpload} imageUrl={originalImage?.url ?? null} />
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    2. Describe the New Roof
                  </label>
                  <input
                    id="prompt"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., CertainTeed Landmark shingles in Moire Black"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !originalImage || !prompt}
                    className="flex-1 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed bg-[#ED2C29] hover:bg-[#C02248]"
                  >
                    {isLoading ? 'Generating...' : 'Visualize Roof'}
                  </button>
                  {originalImage && (
                    <button
                      onClick={handleReset}
                      disabled={isLoading}
                      className="text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Reset form"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="relative min-h-[20rem]">
                {isLoading && <Loader />}
                {!isLoading && error && (
                  <div className="flex items-center justify-center h-full bg-red-900/50 text-red-300 border border-red-800 rounded-lg p-4">
                    <p>{error}</p>
                  </div>
                )}
                {!isLoading && !error && (
                  <ResultDisplay 
                    originalImageUrl={originalImage?.url ?? null}
                    generatedImageUrl={generatedImage} 
                    onEnlarge={handleOpenModal}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <footer className="text-center mt-8 text-gray-400 text-sm">
          <p>
            <a href="https://tech.cmacroofing.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">
              created by tech.cmacroofing.com
            </a>
          </p>
        </footer>
      </main>
      <Modal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        imageUrl={modalImageUrl}
      />
    </div>
  );
};

export default App;
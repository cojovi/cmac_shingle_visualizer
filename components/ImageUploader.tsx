import React, { useRef, useCallback, useState, useEffect } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
}

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, isCameraOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    stopCamera();
    inputRef.current?.click();
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  const startCamera = async () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setCameraError(null);
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access camera. Please check permissions and try again.");
        setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setIsCameraOpen(false);
  }

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], "camera-shot.jpg", { type: "image/jpeg" });
                      onImageUpload(file);
                      stopCamera();
                  }
              }, 'image/jpeg');
          }
      }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        1. Upload or Capture House Image
      </label>
      
      {isCameraOpen ? (
        <div className="bg-gray-700 rounded-lg p-2">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md" />
            {cameraError && <p className="text-red-400 text-sm mt-2 text-center">{cameraError}</p>}
            <div className="flex gap-2 mt-2">
                <button onClick={capturePhoto} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Take Picture
                </button>
                <button onClick={stopCamera} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Cancel
                </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-700 overflow-hidden"
        >
            <input
              type="file"
              ref={inputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {imageUrl ? (
              <img src={imageUrl} alt="Uploaded house" className="w-full h-full object-cover" onClick={handleUploadClick} />
            ) : (
              <div className="text-center p-4">
                <FileIcon />
                 <p className="mt-4 text-sm text-gray-300">
                    Drag & drop an image or
                 </p>
                 <div className="flex flex-col sm:flex-row gap-2 mt-2">
                     <button onClick={handleUploadClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                         Upload File
                     </button>
                     <button onClick={startCamera} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                         Use Camera
                     </button>
                 </div>
                 <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 10MB</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
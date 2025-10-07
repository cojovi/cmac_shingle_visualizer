import React from 'react';

// This is a Base64 encoded SVG of the CMAC Roofing logo, designed to be legible in dark mode.
// It uses fonts already loaded by the application ('Teko' and 'Roboto') to ensure brand consistency.
const cmacLogoBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNzAiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCAxNzAgNDUiPjxzdHlsZT4uY21hYyB7IGZvbnQtZmFtaWx5OiAnVGVrbycsIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMzBweDsgbGV0dGVyLXNwYWNpbmc6IDNweDsgZmlsbDogI0ZGRkZGRjsgZm9udC13ZWlnaHQ6IDcwMDsgdGV4dC1hbmNob3I6IG1pZGRsZTsgfS5zdGFycyB7IGZvbnQtZmFtaWx5OiAnVGVrbycsIHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMTBweDsgZmlsbDogI0ZGRkZGRjsgdGV4dC1hbmNob3I6IG1pZGRsZTsgfS5yb29maW5nIHsgZm9udC1mYW1pbHk6ICdSb2JvdG8nLCBzYW5zLXNlcmlmOyBmb250LXNpemU6IDlweDsgbGV0dGVyLXNwYWNpbmc6IDEuNXB4OyBmaWxsOiAjRkZGRkZGOyB0ZXh0LWFuY2hvcjogbWlkZGxlOyB9PC9zdHlsZT48dGV4dCB4PSI1MCUiIHk9IjE4IiBjbGFzcz0iY21hYyI+Q01BQzwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjI4IiBjbGFzcz0ic3RhcnMiPuKYheKYheKYhTwvdGV4dD48bGluZSB4MT0iMjAiIHkxPSIzMSIgeDI9IjE1MCIgeTI9IjMxIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjUwJSIgeT0iMzkiIGNsYXNzPSJyb29maW5nIj5ST09GSU5HPC90ZXh0Pjwvc3ZnPg==';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md border-b border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={cmacLogoBase64} alt="CMAC Roofing Logo" className="h-10" />
        </div>
         <div className="font-teko text-xl tracking-wide text-gray-300 uppercase">
              Design Visualizer
        </div>
      </div>
    </header>
  );
};
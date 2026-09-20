export interface ShingleColor {
  id: string;
  name: string;
  reference: string;
  swatch: string;
}
export interface ShingleProduct {
  id: string;
  brand: string;
  name: string;
  style: string;
  description: string;
  source: string;
  verified: string;
  colors: ShingleColor[];
}
export interface Photo {
  data: string;
  mimeType: string;
  name: string;
  width: number;
  height: number;
}
export interface Selection {
  productId: string;
  colorId: string;
}
export interface CustomShingle {
  brand: string;
  style: string;
  color: string;
}
export interface Design {
  id: string;
  createdAt: number;
  original: Photo;
  image: string;
  selection: Selection;
  label: string;
  reference?: Photo;
  custom?: CustomShingle;
}
export interface GenerationRequest {
  photo: Photo;
  selection: Selection;
  reference?: Photo;
  custom?: CustomShingle;
}
export interface UploadedFile {
  file: File;
  url: string;
}

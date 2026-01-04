
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

export enum ArtModel {
  FLASH = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}

export interface GeneratedArt {
  id: string;
  url: string;
  prompt: string;
  model: ArtModel;
  timestamp: number;
  aspectRatio: AspectRatio;
  sourceImage?: string;
}

export interface ArtGenerationOptions {
  prompt: string;
  model: ArtModel;
  aspectRatio: AspectRatio;
  imageSize?: ImageSize;
  sourceImageBase64?: string;
  mimeType?: string;
}

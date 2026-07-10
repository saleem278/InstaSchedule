export interface GenerateImageOptions {
  width?: number;
  height?: number;
  seed?: number;
  // Optional model identifier to select a specific image model (provider-specific)
  model?: string;
}

export interface GeneratedImage {
  url: string;
  buffer?: Buffer;
  provider: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage>;
}

export interface GenerateImageOptions {
  width?: number;
  height?: number;
  seed?: number;
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

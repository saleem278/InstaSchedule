export interface CaptionGenerationInput {
  topic: string;
  brand: {
    name: string;
    tone?: string;
    audience?: string;
  };
  // Optional model override for the text provider (e.g. 'gemini-2.5-flash')
  model?: string;
}

export interface CaptionGenerationOutput {
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  imagePrompt: string;
}

export type RegenerableField = 'caption' | 'cta' | 'hashtags' | 'altText' | 'imagePrompt';

export interface TextProvider {
  readonly name: string;
  generateFullContent(input: CaptionGenerationInput): Promise<CaptionGenerationOutput>;
  regenerateField(
    field: RegenerableField,
    input: CaptionGenerationInput & { previousOutput?: Partial<CaptionGenerationOutput> }
  ): Promise<Partial<CaptionGenerationOutput>>;
}

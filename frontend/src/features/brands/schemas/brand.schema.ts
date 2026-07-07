import { z } from 'zod';

/**
 * Frontend Zod schemas for the Brand feature. Mirrors
 * backend/src/features/brands/brand.validation.ts field-for-field, split
 * per wizard step so React Hook Form can validate each step independently.
 */

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const TONE_OPTIONS = [
  'Playful',
  'Professional',
  'Bold',
  'Minimal',
  'Luxurious',
  'Friendly',
  'Witty',
  'Inspirational',
] as const;

export type ToneOption = (typeof TONE_OPTIONS)[number];

export const MAX_TONE_SELECTION = 3;

export interface FontPairing {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: 'classic-serif', name: 'Classic Serif', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif' },
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    headingFont: '"Helvetica Neue", Arial, sans-serif',
    bodyFont: '"Helvetica Neue", Arial, sans-serif',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    headingFont: 'Georgia, serif',
    bodyFont: '"Helvetica Neue", Arial, sans-serif',
  },
  { id: 'geometric', name: 'Geometric', headingFont: 'Futura, "Century Gothic", sans-serif', bodyFont: 'Futura, "Century Gothic", sans-serif' },
  { id: 'friendly-round', name: 'Friendly Rounded', headingFont: 'Verdana, sans-serif', bodyFont: 'Verdana, sans-serif' },
  { id: 'elegant-script', name: 'Elegant Script', headingFont: '"Brush Script MT", cursive', bodyFont: 'Georgia, serif' },
];

// ---- Step 1: Identity ----
export const identityStepSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  logoUrl: z.string().url('Upload a logo or provide a valid URL').optional().or(z.literal('')),
  website: z.string().url('Enter a valid URL (include https://)').optional().or(z.literal('')),
  instagramUsername: z.string().trim().optional().or(z.literal('')),
});

export type IdentityStepValues = z.infer<typeof identityStepSchema>;

// ---- Step 2: Visual Identity ----
export const visualStepSchema = z.object({
  primaryColor: z.string().regex(hexColorRegex, 'Enter a valid hex color'),
  secondaryColor: z.string().regex(hexColorRegex, 'Enter a valid hex color').optional().or(z.literal('')),
  fontPairingId: z.string().trim().min(1, 'Pick a font pairing'),
});

export type VisualStepValues = z.infer<typeof visualStepSchema>;

// ---- Step 3: Voice ----
export const voiceStepSchema = z.object({
  tone: z
    .array(z.enum(TONE_OPTIONS))
    .min(1, 'Select at least one tone')
    .max(MAX_TONE_SELECTION, `Select up to ${MAX_TONE_SELECTION} tones`),
  audience: z.string().trim().min(1, 'Describe the target audience'),
});

export type VoiceStepValues = z.infer<typeof voiceStepSchema>;

// ---- Instagram connection (Brand Settings only; not part of the creation wizard) ----
// Both optional so the shared brandFormSchema stays valid for the creation
// wizard, which doesn't render these fields.
export const instagramConnectionSchema = z.object({
  instagramUserId: z.string().trim().optional().or(z.literal('')),
  instagramAccessToken: z.string().optional().or(z.literal('')),
});

// ---- Combined (what actually gets sent to the API) ----
export const brandFormSchema = identityStepSchema
  .merge(visualStepSchema)
  .merge(voiceStepSchema)
  .merge(instagramConnectionSchema);

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const brandFormDefaultValues: BrandFormValues = {
  name: '',
  logoUrl: '',
  website: '',
  instagramUsername: '',
  instagramUserId: '',
  instagramAccessToken: '',
  primaryColor: '#7C3AED',
  secondaryColor: '',
  fontPairingId: FONT_PAIRINGS[0]!.id,
  tone: [],
  audience: '',
};

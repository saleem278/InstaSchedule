import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { listProviders } from '@/features/system/api/providers.api';
import type { UseFormReturn } from 'react-hook-form';
import type { BrandFormValues } from '../schemas/brand.schema';

interface Props {
  brandId: string;
  form: UseFormReturn<BrandFormValues>;
}

const TEXT_PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  groq: [
    { label: 'GPT OSS 20B (Default)', value: 'openai/gpt-oss-20b' },
    { label: 'Llama 3 8B', value: 'llama3-8b-8192' },
    { label: 'Llama 3 70B', value: 'llama3-70b-8192' },
    { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
  ],
  openai: [
    { label: 'GPT-4o Mini (Default)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ],
  gemini: [
    { label: 'Gemini 2.5 Flash (Default)', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  ],
};

const IMAGE_PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  gemini: [
    { label: 'Imagen 4.0 Generate (Default)', value: 'imagen-4.0-generate-001' },
    { label: 'Gemini 3.1 Flash Image', value: 'gemini-3.1-flash-image' },
  ],
  pollinations: [
    { label: 'Default Model', value: '' },
    { label: 'Flux', value: 'flux' },
  ],
  huggingface: [
    { label: 'FLUX.1 Schnell (Default)', value: 'black-forest-labs/FLUX.1-schnell' },
    { label: 'Stable Diffusion XL 1.0', value: 'stabilityai/stable-diffusion-xl-base-1.0' },
    { label: 'Stable Diffusion 3 Medium', value: 'stabilityai/stable-diffusion-3-medium-diffusers' },
    { label: 'Openjourney', value: 'prompthero/openjourney' },
  ],
  'cloudflare-workers': [
    { label: 'SDXL Lightning (Default)', value: '@cf/bytedance/stable-diffusion-xl-lightning' },
    { label: 'Stable Diffusion XL 1.0', value: '@cf/stabilityai/stable-diffusion-xl-base-1.0' },
    { label: 'Dreamshaper 8 LCM', value: '@cf/lykon/dreamshaper-8-lcm' },
  ],
};

export function ProviderSelector({ brandId, form }: Props): React.JSX.Element {
  const { data: providers } = useQuery({ queryKey: ['providers', brandId], queryFn: () => listProviders(brandId) });

  const watchedTextProvider = form.watch('defaultTextProvider') || '';
  const watchedImageProvider = form.watch('defaultImageProvider') || '';
  const textModelValue = form.watch('defaultTextModel') || '';
  const imageModelValue = form.watch('defaultImageModel') || '';

  const textModels = TEXT_PROVIDER_MODELS[watchedTextProvider] || [];
  const imageModels = IMAGE_PROVIDER_MODELS[watchedImageProvider] || [];

  const isCustomTextModel = textModelValue !== '' && !textModels.some((m) => m.value === textModelValue);
  const isCustomImageModel = imageModelValue !== '' && !imageModels.some((m) => m.value === imageModelValue);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {/* Text Provider & Model Settings */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Default text provider</label>
          <Select
            value={watchedTextProvider}
            onValueChange={(v) => {
              form.setValue('defaultTextProvider', v, { shouldDirty: true });
              form.setValue('defaultTextModel', '', { shouldDirty: true });
            }}
          >
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Text provider" />
            </SelectTrigger>
            <SelectContent>
              {providers?.textProviders.map((p) => (
                <SelectItem key={p.name} value={p.name} disabled={!p.available}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {watchedTextProvider && (
          <div>
            <label className="text-sm font-medium">Default text model</label>
            <Select
              value={isCustomTextModel ? '__custom__' : textModelValue}
              onValueChange={(v) => {
                if (v === '__custom__') {
                  form.setValue('defaultTextModel', ' ', { shouldDirty: true }); // Space to trigger custom render
                } else {
                  form.setValue('defaultTextModel', v, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select text model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Use system default</SelectItem>
                {textModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom Model...</SelectItem>
              </SelectContent>
            </Select>

            {(isCustomTextModel || textModelValue === ' ') && (
              <Input
                className="mt-2"
                placeholder="Enter custom model ID"
                value={textModelValue === ' ' ? '' : textModelValue}
                onChange={(e) => form.setValue('defaultTextModel', e.target.value, { shouldDirty: true })}
              />
            )}
          </div>
        )}
      </div>

      {/* Image Provider & Model Settings */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Default image provider</label>
          <Select
            value={watchedImageProvider}
            onValueChange={(v) => {
              form.setValue('defaultImageProvider', v, { shouldDirty: true });
              form.setValue('defaultImageModel', '', { shouldDirty: true });
            }}
          >
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Image provider" />
            </SelectTrigger>
            <SelectContent>
              {providers?.imageProviders.map((p) => (
                <SelectItem key={p.name} value={p.name} disabled={!p.available}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {watchedImageProvider && (
          <div>
            <label className="text-sm font-medium">Default image model</label>
            <Select
              value={isCustomImageModel ? '__custom__' : imageModelValue}
              onValueChange={(v) => {
                if (v === '__custom__') {
                  form.setValue('defaultImageModel', ' ', { shouldDirty: true }); // Space to trigger custom render
                } else {
                  form.setValue('defaultImageModel', v, { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select image model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Use system default</SelectItem>
                {imageModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom Model...</SelectItem>
              </SelectContent>
            </Select>

            {(isCustomImageModel || imageModelValue === ' ') && (
              <Input
                className="mt-2"
                placeholder="Enter custom model ID"
                value={imageModelValue === ' ' ? '' : imageModelValue}
                onChange={(e) => form.setValue('defaultImageModel', e.target.value, { shouldDirty: true })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderSelector;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/cn';
import { LogoDropzone } from './LogoDropzone';
import { ColorPickerField } from './ColorPickerField';
import { FontPairingPicker } from './FontPairingPicker';
import { ToneChipSelector } from './ToneChipSelector';
import {
  brandFormDefaultValues,
  brandFormSchema,
  FONT_PAIRINGS,
  identityStepSchema,
  visualStepSchema,
  voiceStepSchema,
  type BrandFormValues,
  type ToneOption,
} from '../schemas/brand.schema';
import { useCreateBrand } from '../hooks/useCreateBrand';
import { useActiveBrandStore } from '../store/activeBrandStore';
import type { BrandPayload } from '../schemas/brand.types';

const STEPS = ['Identity', 'Visual Identity', 'Voice', 'Review'] as const;

const STEP_FIELD_NAMES: Record<number, (keyof BrandFormValues)[]> = {
  0: Object.keys(identityStepSchema.shape) as (keyof BrandFormValues)[],
  1: Object.keys(visualStepSchema.shape) as (keyof BrandFormValues)[],
  2: Object.keys(voiceStepSchema.shape) as (keyof BrandFormValues)[],
  3: [],
};

function toBrandPayload(values: BrandFormValues): BrandPayload {
  const colors = [values.primaryColor, values.secondaryColor].filter(
    (color): color is string => Boolean(color)
  );

  return {
    name: values.name,
    logoUrl: values.logoUrl || undefined,
    website: values.website || undefined,
    instagramUsername: values.instagramUsername || undefined,
    colors: colors.length > 0 ? colors : undefined,
    fonts: [values.fontPairingId],
    tone: values.tone.join(', '),
    audience: values.audience,
  };
}

export function BrandCreationWizard(): React.JSX.Element {
  const navigate = useNavigate();
  const setActiveBrandId = useActiveBrandStore((state) => state.setActiveBrandId);
  const createBrand = useCreateBrand();
  const [step, setStep] = useState(0);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: brandFormDefaultValues,
    mode: 'onChange',
  });

  const values = form.watch();
  const isLastStep = step === STEPS.length - 1;

  const handleNext = async (): Promise<void> => {
    const fieldsToValidate = STEP_FIELD_NAMES[step] ?? [];
    const isStepValid = fieldsToValidate.length === 0 || (await form.trigger(fieldsToValidate));
    if (!isStepValid) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = (): void => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = form.handleSubmit((formValues) => {
    createBrand.mutate(toBrandPayload(formValues), {
      onSuccess: (brand) => {
        setActiveBrandId(brand._id);
        navigate('/brands');
      },
    });
  });

  const selectedFontPairing = FONT_PAIRINGS.find((pairing) => pairing.id === values.fontPairingId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-10">
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-2.5 w-2.5 rounded-full transition-colors',
                index === step
                  ? 'w-6 bg-accent'
                  : index < step
                    ? 'bg-accent'
                    : 'bg-backgroundMuted'
              )}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isLastStep) {
                void onSubmit();
              } else {
                void handleNext();
              }
            }}
            className="flex flex-col gap-6"
          >
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <LogoDropzone
                    value={values.logoUrl}
                    fallbackLabel={values.name ? values.name[0]!.toUpperCase() : '?'}
                    onChange={(url) => form.setValue('logoUrl', url, { shouldValidate: true })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brand-name">Brand name</Label>
                  <Input id="brand-name" placeholder="Acme Co." {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brand-website">Website</Label>
                  <Input
                    id="brand-website"
                    placeholder="https://acme.com"
                    {...form.register('website')}
                  />
                  {form.formState.errors.website && (
                    <p className="text-xs text-danger">{form.formState.errors.website.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brand-instagram">Instagram username</Label>
                  <Input
                    id="brand-instagram"
                    placeholder="acme.official"
                    {...form.register('instagramUsername')}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ColorPickerField
                    label="Primary color"
                    value={values.primaryColor}
                    onChange={(hex) => form.setValue('primaryColor', hex, { shouldValidate: true })}
                    error={form.formState.errors.primaryColor?.message}
                  />
                  <ColorPickerField
                    label="Secondary color"
                    value={values.secondaryColor ?? ''}
                    onChange={(hex) => form.setValue('secondaryColor', hex, { shouldValidate: true })}
                    error={form.formState.errors.secondaryColor?.message}
                  />
                </div>
                <div>
                  <Label>Font pairing</Label>
                  <div className="mt-2">
                    <FontPairingPicker
                      value={values.fontPairingId}
                      onChange={(id) => form.setValue('fontPairingId', id, { shouldValidate: true })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <Label>Brand tone (pick up to 3)</Label>
                  <div className="mt-2">
                    <ToneChipSelector
                      value={values.tone}
                      onChange={(tones) =>
                        form.setValue('tone', tones as ToneOption[], { shouldValidate: true })
                      }
                    />
                  </div>
                  {form.formState.errors.tone && (
                    <p className="mt-1 text-xs text-danger">{form.formState.errors.tone.message as string}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brand-audience">Target audience</Label>
                  <Textarea
                    id="brand-audience"
                    placeholder="Who is this brand speaking to?"
                    rows={4}
                    {...form.register('audience')}
                  />
                  {form.formState.errors.audience && (
                    <p className="text-xs text-danger">{form.formState.errors.audience.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <LogoDropzone value={values.logoUrl} fallbackLabel={values.name[0]?.toUpperCase() ?? '?'} onChange={() => {}} />
                  <div>
                    <p className="text-base font-semibold text-textPrimary">{values.name}</p>
                    {values.website && <p className="text-sm text-textSecondary">{values.website}</p>}
                    {values.instagramUsername && (
                      <p className="text-sm text-textSecondary">@{values.instagramUsername}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-textPrimary">Visual identity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: values.primaryColor }}
                      />
                      <span className="font-mono text-xs text-textSecondary">{values.primaryColor}</span>
                    </div>
                    {values.secondaryColor && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: values.secondaryColor }}
                        />
                        <span className="font-mono text-xs text-textSecondary">{values.secondaryColor}</span>
                      </div>
                    )}
                    <span className="text-xs text-textSecondary">
                      Font: {selectedFontPairing?.name ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-textPrimary">Voice</p>
                  <div className="flex flex-wrap gap-1.5">
                    {values.tone.map((tone) => (
                      <Badge key={tone} variant="accent">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-textSecondary">{values.audience}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={createBrand.isPending}>
                  {createBrand.isPending ? 'Creating…' : 'Create Brand'}
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

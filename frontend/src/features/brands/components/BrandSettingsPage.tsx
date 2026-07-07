import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, CheckCircle2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogoDropzone } from './LogoDropzone';
import { ColorPickerField } from './ColorPickerField';
import { FontPairingPicker } from './FontPairingPicker';
import { ToneChipSelector } from './ToneChipSelector';
import { useBrand } from '../hooks/useBrand';
import { useUpdateBrand } from '../hooks/useUpdateBrand';
import { useDeleteBrand } from '../hooks/useDeleteBrand';
import {
  brandFormSchema,
  FONT_PAIRINGS,
  type BrandFormValues,
  type ToneOption,
} from '../schemas/brand.schema';
import type { Brand, BrandPayload } from '../schemas/brand.types';

function brandToFormValues(brand: Brand): BrandFormValues {
  const colors = brand.colors ?? [];
  const fontPairingId = brand.fonts?.[0] ?? FONT_PAIRINGS[0]!.id;
  const tone = (brand.tone ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean) as ToneOption[];

  return {
    name: brand.name,
    logoUrl: brand.logoUrl ?? '',
    website: brand.website ?? '',
    instagramUsername: brand.instagramUsername ?? '',
    instagramUserId: brand.instagramUserId ?? '',
    // Token is never returned by the API — leave blank; an empty submit keeps
    // the stored token unchanged (see backend brand.service update).
    instagramAccessToken: '',
    primaryColor: colors[0] ?? '#7C3AED',
    secondaryColor: colors[1] ?? '',
    fontPairingId,
    tone,
    audience: brand.audience ?? '',
  };
}

function toBrandPayload(values: BrandFormValues): Partial<BrandPayload> {
  const colors = [values.primaryColor, values.secondaryColor].filter(
    (color): color is string => Boolean(color)
  );

  return {
    name: values.name,
    logoUrl: values.logoUrl || undefined,
    website: values.website || undefined,
    instagramUsername: values.instagramUsername || undefined,
    // Send instagramUserId verbatim — an explicit '' tells the backend to
    // DISCONNECT (clear both id and token). Omitting it (undefined) would make
    // disconnecting impossible.
    instagramUserId: values.instagramUserId ?? '',
    // Only send the token when the user actually typed one; '' means "unchanged"
    // (the backend keeps the stored token) unless disconnecting, where the
    // backend clears it based on the empty userId.
    instagramAccessToken: values.instagramAccessToken ? values.instagramAccessToken : undefined,
    colors: colors.length > 0 ? colors : undefined,
    fonts: [values.fontPairingId],
    tone: values.tone.join(', '),
    audience: values.audience,
  };
}

export function BrandSettingsPage(): React.JSX.Element {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { data: brand, isLoading } = useBrand(brandId);
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const [confirmName, setConfirmName] = useState('');

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: brand ? brandToFormValues(brand) : undefined,
  });

  useEffect(() => {
    if (brand) {
      form.reset(brandToFormValues(brand));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  if (isLoading || !brand || !brandId) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  // form.watch() returns {} until the post-load `form.reset` effect above has
  // run, so on the first render after `brand` resolves every field is still
  // undefined. Fall back to the mapped brand values so child inputs (e.g.
  // ToneChipSelector, which calls value.includes/value.length) never receive
  // an undefined array/string and crash the whole page.
  const watched = form.watch();
  const values: BrandFormValues = watched.name !== undefined ? watched : brandToFormValues(brand);
  const isDeleteConfirmed = confirmName.trim() === brand.name;

  const handleSave = form.handleSubmit((formValues) => {
    updateBrand.mutate({ brandId, payload: toBrandPayload(formValues) });
  });

  const handleDelete = (): void => {
    if (!isDeleteConfirmed) return;
    deleteBrand.mutate(brandId, {
      onSuccess: () => navigate('/brands'),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/brands')} aria-label="Back to brands">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">{brand.name}</h1>
          <p className="text-sm text-textSecondary">Brand settings</p>
        </div>
      </div>

      <Tabs defaultValue="identity">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Name, logo, and links for this brand.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-center">
                <LogoDropzone
                  value={values.logoUrl}
                  fallbackLabel={values.name[0]?.toUpperCase() ?? '?'}
                  onChange={(url) => form.setValue('logoUrl', url, { shouldDirty: true })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-name">Brand name</Label>
                <Input id="settings-name" {...form.register('name')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-website">Website</Label>
                <Input id="settings-website" {...form.register('website')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-instagram">Instagram username</Label>
                <Input id="settings-instagram" {...form.register('instagramUsername')} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateBrand.isPending}>
                  {updateBrand.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle>Visual identity</CardTitle>
              <CardDescription>Colors and typography used across generated content.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ColorPickerField
                  label="Primary color"
                  value={values.primaryColor}
                  onChange={(hex) => form.setValue('primaryColor', hex, { shouldDirty: true })}
                />
                <ColorPickerField
                  label="Secondary color"
                  value={values.secondaryColor ?? ''}
                  onChange={(hex) => form.setValue('secondaryColor', hex, { shouldDirty: true })}
                />
              </div>
              <div>
                <Label>Font pairing</Label>
                <div className="mt-2">
                  <FontPairingPicker
                    value={values.fontPairingId}
                    onChange={(id) => form.setValue('fontPairingId', id, { shouldDirty: true })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateBrand.isPending}>
                  {updateBrand.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice</CardTitle>
              <CardDescription>Tone and target audience used to guide AI generation.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div>
                <Label>Brand tone (pick up to 3)</Label>
                <div className="mt-2">
                  <ToneChipSelector
                    value={values.tone}
                    onChange={(tones) => form.setValue('tone', tones, { shouldDirty: true })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-audience">Target audience</Label>
                <Textarea id="settings-audience" rows={4} {...form.register('audience')} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateBrand.isPending}>
                  {updateBrand.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-accent" />
                Instagram Publishing
              </CardTitle>
              <CardDescription>
                Connect this brand&apos;s Instagram Business/Creator account to publish and schedule posts directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {brand.instagramConnected ? (
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-successSubtle/40 px-3 py-2 text-sm text-textPrimary">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  Connected to Instagram account <span className="font-medium">{values.instagramUserId}</span>
                </div>
              ) : (
                <p className="rounded-md border border-border bg-backgroundMuted/60 px-3 py-2 text-sm text-textSecondary">
                  Not connected yet. Enter your Instagram account details below.
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-ig-user-id">Instagram account ID</Label>
                <Input
                  id="settings-ig-user-id"
                  placeholder="17841400000000000"
                  {...form.register('instagramUserId')}
                />
                <p className="text-xs text-textTertiary">
                  The IG Business/Creator account&apos;s numeric id (found via the Meta Graph API).
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="settings-ig-token">Access token</Label>
                <Input
                  id="settings-ig-token"
                  type="password"
                  autoComplete="off"
                  placeholder={brand.instagramConnected ? 'Leave blank to keep the current token' : 'Long-lived Page access token'}
                  {...form.register('instagramAccessToken')}
                />
                <p className="text-xs text-textTertiary">
                  A long-lived Page access token authorized for content publishing. Stored securely and never shown
                  again.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateBrand.isPending}>
                  {updateBrand.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-danger/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Deleting a brand permanently removes it and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Label htmlFor="confirm-delete">
                Type <span className="font-semibold text-textPrimary">{brand.name}</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
                placeholder={brand.name}
              />
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  disabled={!isDeleteConfirmed || deleteBrand.isPending}
                  onClick={handleDelete}
                >
                  {deleteBrand.isPending ? 'Deleting…' : 'Delete this brand'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

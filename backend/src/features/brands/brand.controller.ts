import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as brandService from './brand.service';
import { CreateBrandInput, UpdateBrandInput } from './brand.validation';
import { BrandModel } from './brand.model';
import { config } from '../../config/env';
import { NotFoundError, ExternalServiceError } from '../../core/errors/AppError';

export const listBrands = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const brands = await brandService.list(userId);
  sendSuccess(res, brands);
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const brandId = req.params.brandId!;
  const brand = await brandService.getById(brandId, userId);
  sendSuccess(res, brand);
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateBrandInput;
  const brand = await brandService.create(userId, data);
  sendSuccess(res, brand, 201);
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const brandId = req.params.brandId!;
  const data = req.body as UpdateBrandInput;
  const brand = await brandService.update(brandId, userId, data);
  sendSuccess(res, brand);
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const brandId = req.params.brandId!;
  await brandService.remove(brandId, userId);
  sendSuccess(res, null);
});

export const searchInstagramAudio = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const brandId = req.params.brandId!;
  const query = (req.query.q as string) || '';
  const type = (req.query.type as 'music' | 'original_sound') || 'music';

  const brand = await BrandModel.findOne({ _id: brandId, user: userId }).select('+instagramAccessToken');
  if (!brand) {
    throw new NotFoundError('Brand not found');
  }

  const isMock =
    config.INSTAGRAM_PUBLISHER === 'mock' ||
    !brand.instagramAccessToken ||
    !brand.instagramUserId;

  const mockTracks = [
    {
      audioAssetId: 'mock_track_1',
      title: 'Futuristic Glow (Lofi)',
      artistName: 'Synthwave Academy',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      audioAssetId: 'mock_track_2',
      title: 'Summer Chill Beats',
      artistName: 'Lofi Generator',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      audioAssetId: 'mock_track_3',
      title: 'Deep Focus Groove',
      artistName: 'Ambient Flow',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
      audioAssetId: 'mock_track_4',
      title: 'Tech Startup Energy',
      artistName: 'Corporate Electro',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      audioAssetId: 'mock_track_5',
      title: 'Hip Hop Instrumental',
      artistName: 'Boom Bap Beats',
      previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    },
  ];

  const getMockFiltered = () => {
    if (query) {
      const q = query.toLowerCase();
      return mockTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q)
      );
    }
    return mockTracks;
  };

  if (isMock) {
    sendSuccess(res, getMockFiltered());
    return;
  }

  const url = new URL(`https://graph.facebook.com/${config.META_GRAPH_API_VERSION}/ig_audio`);
  url.searchParams.append('audio_type', type);
  url.searchParams.append('user_id', brand.instagramUserId!);
  url.searchParams.append('access_token', brand.instagramAccessToken!);
  if (query) {
    url.searchParams.append('search_query', query);
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      // Fallback to mock tracks on API authorization/request errors
      sendSuccess(res, getMockFiltered());
      return;
    }
    const result = (await response.json()) as {
      data: Array<{ id: string; title: string; artist_name: string; preview_url?: string }>;
    };
    const formatted = (result.data || []).map((item) => ({
      audioAssetId: item.id,
      title: item.title,
      artistName: item.artist_name,
      previewUrl: item.preview_url || null,
    }));
    
    // Fallback if Meta search yields no matches
    if (formatted.length === 0) {
      sendSuccess(res, getMockFiltered());
    } else {
      sendSuccess(res, formatted);
    }
  } catch (err) {
    // Fallback to mock tracks on network failure
    sendSuccess(res, getMockFiltered());
  }
});

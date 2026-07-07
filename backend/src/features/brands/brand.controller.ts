import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as brandService from './brand.service';
import { CreateBrandInput, UpdateBrandInput } from './brand.validation';

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

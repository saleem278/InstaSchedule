import { NotFoundError, ConflictError } from '../../core/errors/AppError';
import * as brandRepository from './brand.repository';
import { BrandDocument } from './brand.model';
import { CreateBrandInput, UpdateBrandInput } from './brand.validation';

/**
 * Brand as returned to the client: the raw access token is NEVER included
 * (it's `select: false` on the schema), but we surface a derived boolean so
 * the UI can show a "connected" state without ever handling the secret.
 */
export type BrandResponse = Omit<BrandDocument, 'instagramAccessToken'> & {
  instagramConnected: boolean;
};

function toBrandResponse(brand: BrandDocument): BrandResponse {
  const { instagramAccessToken, ...rest } = brand as BrandDocument & { instagramAccessToken?: string };
  return {
    ...(rest as Omit<BrandDocument, 'instagramAccessToken'>),
    // Connected only when BOTH the account id and a token are stored — publishing
    // needs both, so reporting "connected" on the id alone would mislead the UI.
    instagramConnected: Boolean(brand.instagramUserId && instagramAccessToken),
  };
}

export async function list(userId: string): Promise<BrandResponse[]> {
  const brands = await brandRepository.findAllByUser(userId);
  return brands.map(toBrandResponse);
}

export async function getById(id: string, userId: string): Promise<BrandResponse> {
  const brand = await brandRepository.findByIdForUser(id, userId);
  if (!brand) {
    throw new NotFoundError('Brand not found');
  }
  return toBrandResponse(brand);
}

export async function create(userId: string, data: CreateBrandInput): Promise<BrandResponse> {
  const brand = await brandRepository.create(userId, data);
  return toBrandResponse(brand);
}

export async function update(id: string, userId: string, data: UpdateBrandInput): Promise<BrandResponse> {
  const existing = await brandRepository.findByIdForUser(id, userId);
  if (!existing) {
    throw new NotFoundError('Brand not found');
  }
  const payload: UpdateBrandInput = { ...data };

  // Instagram connection field handling:
  //  - instagramUserId === '' (explicit) => DISCONNECT: clear both id and token.
  //  - instagramAccessToken === '' or omitted => leave the stored token
  //    unchanged (the form can't re-display the never-returned secret).
  //  - non-empty values replace as normal.
  const disconnecting =
    payload.instagramUserId !== undefined && payload.instagramUserId.trim() === '';

  if (disconnecting) {
    payload.instagramUserId = '';
    payload.instagramAccessToken = ''; // repository translates '' -> unset for these fields
  } else if (payload.instagramAccessToken !== undefined && payload.instagramAccessToken.trim() === '') {
    delete payload.instagramAccessToken; // keep existing token
  }

  const updated = await brandRepository.update(id, userId, payload);
  if (!updated) {
    throw new NotFoundError('Brand not found');
  }
  return toBrandResponse(updated);
}

export async function remove(id: string, userId: string): Promise<void> {
  await getById(id, userId);
  const projectCount = await brandRepository.countProjectsForBrand(id);
  if (projectCount > 0) {
    throw new ConflictError('Cannot delete a brand with existing projects');
  }
  await brandRepository.remove(id, userId);
}

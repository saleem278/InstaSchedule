import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { createBrandSchema, updateBrandSchema } from './brand.validation';
import { createBrand, deleteBrand, getBrand, listBrands, updateBrand } from './brand.controller';

export const brandRouter = Router();

brandRouter.use(authenticate);

brandRouter.get('/', listBrands);
brandRouter.post('/', validate(createBrandSchema), createBrand);
brandRouter.get('/:brandId', getBrand);
brandRouter.patch('/:brandId', validate(updateBrandSchema), updateBrand);
brandRouter.delete('/:brandId', deleteBrand);

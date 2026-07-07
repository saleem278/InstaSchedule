import { useState } from 'react';
import { Palette, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrands } from '../hooks/useBrands';
import { BrandCard } from './BrandCard';
import { DeleteBrandDialog } from './DeleteBrandDialog';
import type { Brand } from '../schemas/brand.types';

interface BrandListProps {
  onCreateBrand: () => void;
}

export function BrandList({ onCreateBrand }: BrandListProps): React.JSX.Element {
  const { data: brands, isLoading, isError } = useBrands();
  const [brandPendingDelete, setBrandPendingDelete] = useState<Brand | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-textSecondary">Could not load brands. Please try again.</p>
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
          <Palette className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-textPrimary">No brands yet</h3>
        <p className="mt-1 max-w-sm text-sm text-textSecondary">
          Create your first brand to define its identity, voice, and visual style before generating content.
        </p>
        <Button className="mt-6" onClick={onCreateBrand}>
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard key={brand._id} brand={brand} onRequestDelete={setBrandPendingDelete} />
        ))}
      </div>
      <DeleteBrandDialog
        brand={brandPendingDelete}
        onOpenChange={(open) => {
          if (!open) setBrandPendingDelete(null);
        }}
      />
    </>
  );
}

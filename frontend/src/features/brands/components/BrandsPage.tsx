import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandList } from './BrandList';

export function BrandsPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">Brands</h1>
          <p className="text-sm text-textSecondary">Manage the brand identities used across your content.</p>
        </div>
        <Button onClick={() => navigate('/brands/new')}>
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>

      <BrandList onCreateBrand={() => navigate('/brands/new')} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/core/utils/cn';
import { useBrands } from '../hooks/useBrands';
import { useActiveBrandStore } from '../store/activeBrandStore';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Self-contained brand switcher: logo + name + chevron trigger that opens a
 * popover listing all brands with a "+ New Brand" action pinned at the
 * bottom. Any sidebar can mount this directly — it owns its own data
 * fetching and active-brand state via useActiveBrandStore.
 */
export function BrandSwitcher(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: brands, isLoading } = useBrands();
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);
  const setActiveBrandId = useActiveBrandStore((state) => state.setActiveBrandId);

  const activeBrand = brands?.find((brand) => brand._id === activeBrandId) ?? null;

  // Reconcile a stale persisted activeBrandId (localStorage) against the real
  // list: if it points at a brand the user no longer has (deleted elsewhere,
  // or a different account after login), re-point it at the first available
  // brand (or null when there are none) so downstream brand-scoped queries
  // don't hit a dangling id. Only runs once the list has actually loaded.
  useEffect(() => {
    if (!brands) return;
    if (activeBrandId && !brands.some((brand) => brand._id === activeBrandId)) {
      setActiveBrandId(brands[0]?._id ?? null);
    }
  }, [brands, activeBrandId, setActiveBrandId]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full rounded-md" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-2"
          aria-label="Switch active brand"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={activeBrand?.logoUrl} alt={activeBrand?.name ?? 'Brand'} />
              <AvatarFallback className="text-[10px]">
                {activeBrand ? initials(activeBrand.name) : '—'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{activeBrand?.name ?? 'Select a brand'}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-textTertiary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex flex-col gap-1">
          {brands && brands.length > 0 ? (
            brands.map((brand) => (
              <button
                key={brand._id}
                type="button"
                onClick={() => {
                  setActiveBrandId(brand._id);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-backgroundMuted',
                  brand._id === activeBrandId && 'bg-accentSubtle text-accent'
                )}
              >
                <Avatar className="h-6 w-6 border border-border">
                  <AvatarImage src={brand.logoUrl} alt={brand.name} />
                  <AvatarFallback className="text-[10px]">{initials(brand.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{brand.name}</span>
                {brand._id === activeBrandId && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs text-textSecondary">No brands yet</p>
          )}
        </div>
        <div className="mt-2 border-t border-border pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              navigate('/brands/new');
            }}
          >
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

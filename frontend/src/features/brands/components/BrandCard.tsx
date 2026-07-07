import { useNavigate } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2, Instagram } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/cn';
import { useActiveBrandStore } from '../store/activeBrandStore';
import type { Brand } from '../schemas/brand.types';

interface BrandCardProps {
  brand: Brand;
  onRequestDelete: (brand: Brand) => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function BrandCard({ brand, onRequestDelete }: BrandCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);
  const setActiveBrandId = useActiveBrandStore((state) => state.setActiveBrandId);
  const isActive = activeBrandId === brand._id;
  const colors = brand.colors ?? [];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => setActiveBrandId(brand._id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActiveBrandId(brand._id);
        }
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-4 p-5 transition-shadow duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isActive && 'border-accent ring-1 ring-accent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={brand.logoUrl} alt={brand.name} />
            <AvatarFallback>{initials(brand.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-textPrimary">{brand.name}</p>
            {brand.instagramUsername ? (
              <p className="flex items-center gap-1 truncate text-xs text-textSecondary">
                <Instagram className="h-3 w-3 shrink-0" />@{brand.instagramUsername}
              </p>
            ) : (
              <p className="text-xs text-textTertiary">No Instagram linked</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(event) => event.stopPropagation()}
              aria-label={`Actions for ${brand.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onClick={() => navigate(`/brands/${brand._id}/settings`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-danger focus:bg-dangerSubtle focus:text-danger"
              onClick={() => onRequestDelete(brand)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {colors.length > 0 && (
        <div className="flex h-2 w-full overflow-hidden rounded-full border border-border">
          {colors.map((color, index) => (
            <div key={`${color}-${index}`} className="h-full flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {isActive ? (
          <Badge variant="accent">Active</Badge>
        ) : (
          <span className="text-xs text-textTertiary">Click to set active</span>
        )}
      </div>
    </Card>
  );
}

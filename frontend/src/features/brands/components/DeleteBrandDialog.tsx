import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteBrand } from '../hooks/useDeleteBrand';
import type { Brand } from '../schemas/brand.types';

interface DeleteBrandDialogProps {
  brand: Brand | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight confirm dialog built on the shared Dialog primitive (an
 * AlertDialog primitive isn't in the component library yet, so this is the
 * project's stand-in for one — same visual language, single confirm action).
 */
export function DeleteBrandDialog({ brand, onOpenChange }: DeleteBrandDialogProps): React.JSX.Element {
  const deleteBrand = useDeleteBrand();

  const handleConfirm = (): void => {
    if (!brand) return;
    deleteBrand.mutate(brand._id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={Boolean(brand)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete brand</DialogTitle>
          <DialogDescription>
            {brand
              ? `This will permanently delete "${brand.name}" and cannot be undone.`
              : 'This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteBrand.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteBrand.isPending}>
            {deleteBrand.isPending ? 'Deleting…' : 'Delete brand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

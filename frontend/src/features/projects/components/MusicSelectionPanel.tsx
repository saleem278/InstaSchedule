import { useState, useEffect, useRef } from 'react';
import { Music, Search, Play, Pause, Trash2, Loader2, Music2, Info } from 'lucide-react';
import { useBrandAudio } from '@/features/brands/hooks/useBrandAudio';
import { useUpdateProject } from '../hooks/useUpdateProject';
import type { Project, ProjectMusic } from '../schemas/project.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MusicSelectionPanelProps {
  project: Project;
}

export function MusicSelectionPanel({ project }: MusicSelectionPanelProps): React.JSX.Element {
  const updateProjectMutation = useUpdateProject();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch audio tracks
  const { data: tracks = [], isLoading } = useBrandAudio(
    project.brand,
    searchQuery,
    isSearching || isOpen
  );

  // Audio playing state
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (playingUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(playingUrl);
      audioRef.current.play().catch(() => {
        toast.error('Could not preview this track.');
        setPlayingUrl(null);
      });
      audioRef.current.onended = () => setPlayingUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [playingUrl]);

  const handleOpenSearch = () => {
    setIsOpen(true);
    setSearchQuery('');
    setTypedQuery('');
    setIsSearching(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(typedQuery.trim());
    setIsSearching(true);
  };

  const handleSelectTrack = async (track: ProjectMusic) => {
    setPlayingUrl(null);
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project._id,
        payload: { music: track },
      });
      toast.success(`Track "${track.title}" attached to post.`);
      setIsOpen(false);
    } catch {
      toast.error('Failed to attach track.');
    }
  };

  const handleRemoveTrack = async () => {
    setPlayingUrl(null);
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project._id,
        payload: { music: null },
      });
      toast.success('Music track removed from post.');
    } catch {
      toast.error('Failed to remove track.');
    }
  };

  const togglePlay = (url: string | null | undefined) => {
    if (!url) {
      toast.error('No audio preview available for this track.');
      return;
    }
    if (playingUrl === url) {
      setPlayingUrl(null);
    } else {
      setPlayingUrl(url);
    }
  };

  const currentMusic = project.music;

  return (
    <Card className="border border-border bg-surface shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Music className="h-4 w-4 text-accent" />
          Instagram Audio / Music
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">
          Attach a soundtrack to your post.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentMusic ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accentSubtle/5 p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
                <Music2 className="h-4.5 w-4.5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="truncate text-xs font-semibold text-textPrimary" title={currentMusic.title}>
                  {currentMusic.title}
                </h4>
                <p className="truncate text-[10px] text-textSecondary" title={currentMusic.artistName}>
                  {currentMusic.artistName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {currentMusic.previewUrl && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => togglePlay(currentMusic.previewUrl)}
                  className="h-8 w-8 text-textSecondary hover:text-textPrimary"
                >
                  {playingUrl === currentMusic.previewUrl ? (
                    <Pause className="h-4 w-4 text-accent" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRemoveTrack}
                disabled={updateProjectMutation.isPending}
                className="h-8 w-8 text-textSecondary hover:text-danger"
                title="Remove music"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs gap-1.5 h-9"
            onClick={handleOpenSearch}
          >
            <Music className="h-3.5 w-3.5" />
            Add Instagram Music
          </Button>
        )}

        <div className="flex gap-2 rounded-md bg-surfaceMuted/40 border border-border/20 p-2.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-textTertiary mt-0.5" />
          <p className="text-[10px] leading-normal text-textSecondary">
            Meta Graph APIs officially support auto-publishing music only on **Reels (Video)** posts. For photo posts and carousels, this selection is saved as planning metadata.
          </p>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={(val) => {
        setIsOpen(val);
        if (!val) setPlayingUrl(null);
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Select Instagram Music</DialogTitle>
            <DialogDescription className="text-[11px]">
              Search Meta&apos;s audio library to find and preview tracks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 py-2">
            <Input
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              placeholder="e.g. Summer Lofi, Chillwave..."
              className="h-8.5 text-xs"
            />
            <Button type="submit" size="sm" className="h-8.5 text-xs gap-1.5 px-3">
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
          </form>

          <div className="max-h-[260px] overflow-y-auto min-h-[140px] border border-border/60 rounded-md divide-y divide-border/40 scrollbar-none bg-surfaceMuted/10">
            {isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-textTertiary" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 px-4 text-center">
                <Music className="h-5 w-5 text-textTertiary" />
                <p className="mt-2 text-xs text-textSecondary">No tracks found.</p>
                <p className="text-[10px] text-textTertiary mt-0.5">Try searching with other keywords.</p>
              </div>
            ) : (
              tracks.map((track) => (
                <div key={track.audioAssetId} className="flex items-center justify-between p-3 gap-2 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => togglePlay(track.previewUrl)}
                      className="h-7.5 w-7.5 shrink-0 rounded-full border-border/60 hover:bg-backgroundMuted"
                      title={playingUrl === track.previewUrl ? 'Pause preview' : 'Play preview'}
                    >
                      {playingUrl === track.previewUrl ? (
                        <Pause className="h-3 w-3 text-accent" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <div className="overflow-hidden">
                      <h4 className="truncate text-xs font-semibold text-textPrimary" title={track.title}>
                        {track.title}
                      </h4>
                      <p className="truncate text-[10px] text-textSecondary" title={track.artistName}>
                        {track.artistName}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSelectTrack(track)}
                    className="h-7 text-[11px] px-2.5 font-semibold shrink-0"
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="sm:justify-start pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

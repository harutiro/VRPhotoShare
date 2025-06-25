import { Card, Title, Grid, Text } from '@mantine/core';
import type { ViewedAlbum, AlbumThumbnail } from '../types/album';
import { AlbumCard } from './AlbumCard';

interface RecentAlbumsSectionProps {
  viewedAlbums: ViewedAlbum[];
  albumThumbnails: Record<string, AlbumThumbnail | null>;
  onAlbumClick: (customId: string) => void;
}

export const RecentAlbumsSection = ({ 
  viewedAlbums, 
  albumThumbnails, 
  onAlbumClick 
}: RecentAlbumsSectionProps) => {
  if (viewedAlbums.length === 0) {
    return null;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">最近見たアルバム</Title>
      <Grid>
        {viewedAlbums.slice(0, 6).map((album) => {
          const thumbnail = albumThumbnails[album.custom_id];
          return (
            <Grid.Col key={album.custom_id} span={{ base: 12, sm: 6, md: 4 }}>
              <AlbumCard
                album={album}
                thumbnail={thumbnail}
                onClick={onAlbumClick}
              />
            </Grid.Col>
          );
        })}
      </Grid>
      {viewedAlbums.length > 6 && (
        <Text c="dimmed" size="sm" ta="center" mt="md">
          他 {viewedAlbums.length - 6} 件
        </Text>
      )}
    </Card>
  );
}; 
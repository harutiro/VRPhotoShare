import { Paper, Box, Text, Stack } from '@mantine/core';
import type { ViewedAlbum, AlbumThumbnail } from '../types/album';
import { formatDate } from '../utils/dateUtils';

interface AlbumCardProps {
  album: ViewedAlbum;
  thumbnail: AlbumThumbnail | null | undefined;
  onClick: (customId: string) => void;
}

export const AlbumCard = ({ album, thumbnail, onClick }: AlbumCardProps) => {
  return (
    <Paper 
      shadow="xs" 
      p={0}
      withBorder 
      style={{ cursor: 'pointer', overflow: 'hidden' }}
      onClick={() => onClick(album.custom_id)}
    >
      <Box pos="relative">
        {/* サムネイル画像 */}
        <Box
          h={120}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: thumbnail && thumbnail.thumbnailUrl ? 'transparent' : '#f1f3f4',
            backgroundImage: thumbnail && thumbnail.thumbnailUrl ? `url(${thumbnail.thumbnailUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {(!thumbnail || !thumbnail.thumbnailUrl) && (
            <Text c="dimmed" size="sm">
              {thumbnail === null ? '画像なし' : '読み込み中...'}
            </Text>
          )}
        </Box>
        
        {/* アルバム情報オーバーレイ */}
        <Box
          pos="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="rgba(0, 0, 0, 0.7)"
          p="sm"
        >
          <Stack gap="xs">
            <Text fw={500} size="sm" c="white" truncate>
              {album.name}
            </Text>
            <Text c="white" size="xs" opacity={0.8}>
              ID: {album.custom_id}
            </Text>
            <Text c="white" size="xs" opacity={0.8}>
              {formatDate(album.viewedAt)}
            </Text>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}; 
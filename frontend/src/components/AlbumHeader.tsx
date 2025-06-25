import { Group, Stack, Title, Text, Checkbox, Tooltip, ActionIcon } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { 
  IconEdit, 
  IconArrowsSort, 
  IconUpload, 
  IconDownload, 
  IconShare, 
  IconTrash 
} from '@tabler/icons-react';
import type { Album } from '../types/photo';

interface AlbumHeaderProps {
  album: Album | null;
  photosCount: number;
  allSelected: boolean;
  isIndeterminate: boolean;
  sortOrder: 'asc' | 'desc';
  selectedPhotosCount: number;
  isZipping: boolean;
  onEditName: () => void;
  onSortChange: () => void;
  onUpload: () => void;
  onBulkDownload: () => void;
  onDeleteAlbum: () => void;
  onSelectAllChange: (checked: boolean) => void;
}

export const AlbumHeader = ({
  album,
  photosCount,
  allSelected,
  isIndeterminate,
  sortOrder,
  selectedPhotosCount,
  isZipping,
  onEditName,
  onSortChange,
  onUpload,
  onBulkDownload,
  onDeleteAlbum,
  onSelectAllChange
}: AlbumHeaderProps) => {
  const clipboard = useClipboard({ timeout: 500 });

  const handleShareAlbum = () => {
    clipboard.copy(window.location.href);
    notifications.show({
      title: 'リンクをコピーしました',
      message: 'アルバムリンクをクリップボードにコピーしました。',
      color: 'green',
    });
  };

  return (
    <Group justify="space-between" mb="lg" align="center">
      <Stack gap="xs">
        <Group align="center" gap="xs">
          <Title order={2} style={{ marginRight: 8 }}>{album?.name}</Title>
          <Tooltip label="アルバム名を編集">
            <ActionIcon variant="light" color="blue" onClick={onEditName} size="lg">
              <IconEdit size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Text c="dimmed">{photosCount} photos</Text>
        <Checkbox
          label="すべて選択"
          checked={allSelected}
          indeterminate={isIndeterminate}
          onChange={(e) => onSelectAllChange(e.currentTarget.checked)}
          disabled={photosCount === 0}
        />
      </Stack>
      <Group gap="xs">
        <Tooltip label={sortOrder === 'desc' ? '新しい順' : '古い順'}>
          <ActionIcon
            variant="filled"
            color="gray"
            onClick={onSortChange}
            size="lg"
          >
            <IconArrowsSort size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="写真をアップロード">
          <ActionIcon
            variant="filled"
            color="blue"
            onClick={onUpload}
            size="lg"
          >
            <IconUpload size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="選択した写真をダウンロード">
          <ActionIcon
            variant="filled"
            color="teal"
            onClick={onBulkDownload}
            size="lg"
            disabled={selectedPhotosCount === 0 || isZipping}
          >
            <IconDownload size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="アルバムリンクをコピー">
          <ActionIcon
            variant="filled"
            color="gray"
            onClick={handleShareAlbum}
            size="lg"
          >
            <IconShare size={20} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="アルバムを削除">
          <ActionIcon
            variant="filled"
            color="red"
            onClick={onDeleteAlbum}
            size="lg"
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}; 
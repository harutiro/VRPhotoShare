import { Grid, Card, Box, Checkbox, ActionIcon, Image, Title } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { Photo, WorldGroup } from '../types/photo';

interface PhotoGridProps {
  worldGroups: WorldGroup;
  selectedPhotos: number[];
  onPhotoClick: (photo: Photo) => void;
  onSelectionChange: (id: number, checked: boolean) => void;
  onDelete: (photoId: number) => void;
}

export const PhotoGrid = ({ 
  worldGroups, 
  selectedPhotos, 
  onPhotoClick, 
  onSelectionChange, 
  onDelete 
}: PhotoGridProps) => {
  return (
    <>
      {Object.entries(worldGroups).map(([world, groupPhotos]) => (
        <div key={world} style={{ marginBottom: 32 }}>
          <Title order={3} mb="xs">{world}</Title>
          <Grid>
            {groupPhotos.map((photo) => (
              <Grid.Col key={photo.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card shadow="sm" padding={0} radius="md" withBorder>
                  <Box pos="relative">
                    <Checkbox
                      pos="absolute" 
                      top={10} 
                      left={10}
                      style={{ zIndex: 1 }}
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={(e) => onSelectionChange(photo.id, e.currentTarget.checked)}
                      aria-label="写真を選択"
                    />
                    <ActionIcon 
                      variant="filled" 
                      color="red" 
                      radius="xl" 
                      size="sm"
                      pos="absolute" 
                      top={10} 
                      right={10}
                      style={{ zIndex: 1 }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDelete(photo.id); 
                      }}
                      title="写真を削除"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                    <Card.Section>
                      <Image
                        src={photo.thumbnailUrl || photo.url}
                        height={180}
                        alt={photo.name}
                        onClick={() => onPhotoClick(photo)}
                        style={{ cursor: 'pointer' }}
                      />
                    </Card.Section>
                  </Box>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>
      ))}
    </>
  );
}; 
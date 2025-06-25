import { useNavigate } from 'react-router-dom';
import { Container, Stack, Grid } from '@mantine/core';
import { notifications } from '@mantine/notifications';

// Components
import { AlphaBanner } from '../components/AlphaBanner';
import { CreateAlbumSection } from '../components/CreateAlbumSection';
import { ViewAlbumSection } from '../components/ViewAlbumSection';
import { RecentAlbumsSection } from '../components/RecentAlbumsSection';
import { InstructionsSection } from '../components/InstructionsSection';
import { VRCXInfoSection } from '../components/VRCXInfoSection';

// Hooks
import { useViewedAlbums } from '../hooks/useViewedAlbums';
import { useAlbumThumbnails } from '../hooks/useAlbumThumbnails';

// Utils
import { checkAlbumExists } from '../utils/albumApi';

export const HomePage = () => {
  const navigate = useNavigate();
  const { viewedAlbums, removeFromViewedAlbums } = useViewedAlbums();
  const albumThumbnails = useAlbumThumbnails(viewedAlbums, removeFromViewedAlbums);

  const handleCreateAlbum = () => {
    navigate('/create-album');
  };

  const handleViewAlbum = async (albumId: string) => {
    try {
      const exists = await checkAlbumExists(albumId);
      if (!exists) {
        notifications.show({
          title: 'エラー',
          message: '指定されたアルバムIDのアルバムは存在しません。',
          color: 'red',
        });
        return;
      }
      navigate(`/album/${albumId}`);
    } catch {
      notifications.show({
        title: 'エラー',
        message: 'アルバムの検索中にエラーが発生しました。',
        color: 'red',
      });
    }
  };

  const handleAlbumClick = (customId: string) => {
    navigate(`/album/${customId}`);
  };

  return (
    <Container size="lg" my="xl">
      <Stack gap="xl">
        <AlphaBanner />
        
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <CreateAlbumSection onCreateAlbum={handleCreateAlbum} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ViewAlbumSection onViewAlbum={handleViewAlbum} />
          </Grid.Col>
        </Grid>

        <RecentAlbumsSection
          viewedAlbums={viewedAlbums}
          albumThumbnails={albumThumbnails}
          onAlbumClick={handleAlbumClick}
        />

        <InstructionsSection />

        <VRCXInfoSection />
      </Stack>
    </Container>
  );
};

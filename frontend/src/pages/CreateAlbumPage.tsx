import { useNavigate } from 'react-router-dom';
import { Container } from '@mantine/core';
import { useAlbumCreation } from '../hooks/useAlbumCreation';
import { AlbumCreationForm } from '../components/AlbumCreationForm';

export const CreateAlbumPage = () => {
  const navigate = useNavigate();
  
  const albumCreation = useAlbumCreation((customId: string) => {
    navigate(`/album/${customId}`);
  });

  return (
    <Container size="sm" my="xl">
      <AlbumCreationForm
        name={albumCreation.name}
        customId={albumCreation.customId}
        loading={albumCreation.loading}
        onNameChange={albumCreation.setName}
        onCustomIdChange={albumCreation.setCustomId}
        onSubmit={albumCreation.createAlbum}
      />
    </Container>
  );
};

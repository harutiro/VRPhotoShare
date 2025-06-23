import { useEffect, useState } from 'react';
import { Container, Title, Grid, Card, Image, Text, Skeleton, Center } from '@mantine/core';

interface Photo {
  id: number;
  title: string;
  description: string;
  image_data: string;
  created_at: string;
}

export const PhotoListPage = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('/api/photos');
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }
        const data = await response.json();
        setPhotos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <Container my="md">
        <Grid>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Skeleton height={160} />
                </Card.Section>
                <Skeleton height={8} mt="sm" />
                <Skeleton height={8} mt="xs" width="70%" />
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return <Container my="md"><Center><Text color="red">{error}</Text></Center></Container>;
  }

  return (
    <Container my="md">
      <Title order={2} mb="lg">Photo Gallery</Title>
      {photos.length === 0 ? (
        <Center><Text>No photos yet. Try uploading one!</Text></Center>
      ) : (
        <Grid>
          {photos.map((photo) => (
            <Grid.Col key={photo.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Card.Section>
                  <Image
                    src={`data:image/jpeg;base64,${photo.image_data}`}
                    height={160}
                    alt={photo.title}
                  />
                </Card.Section>
                <Text fw={500} size="lg" mt="md">{photo.title}</Text>
                <Text mt="xs" c="dimmed" size="sm">{photo.description}</Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Container>
  );
};

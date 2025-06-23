import { Burger, Group, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export const Header = ({ opened, toggle }: HeaderProps) => {
  return (
    <Group h="100%" px="md">
      <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      <Group justify="space-between" style={{ flex: 1 }}>
        <Title order={3}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            VR Photo Share
          </Link>
        </Title>
        <Group ml="xl" gap={20} visibleFrom="sm">
            <Button component={Link} to="/create-album" variant="default">Create Album</Button>
            <Button component={Link} to="/upload">Upload Photos</Button>
        </Group>
      </Group>
    </Group>
  );
};

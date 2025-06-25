import { Modal, TextInput, Group, Button } from '@mantine/core';

interface AlbumEditModalProps {
  opened: boolean;
  editName: string;
  onClose: () => void;
  onSave: () => void;
  onEditNameChange: (value: string) => void;
}

export const AlbumEditModal = ({ opened, editName, onClose, onSave, onEditNameChange }: AlbumEditModalProps) => {
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="アルバム名を編集" 
      centered
      styles={{
        inner: {
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: 300,
          zIndex: 201,
        },
      }}
    >
      <TextInput
        value={editName}
        onChange={(e) => onEditNameChange(e.currentTarget.value)}
        size="md"
        style={{ minWidth: 200 }}
        mb="md"
      />
      <Group justify="flex-end">
        <Button color="green" onClick={onSave}>保存</Button>
        <Button variant="default" onClick={onClose}>キャンセル</Button>
      </Group>
    </Modal>
  );
}; 
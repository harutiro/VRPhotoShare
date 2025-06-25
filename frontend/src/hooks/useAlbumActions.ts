import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import type { Album } from '../types/photo';

export const useAlbumActions = (
  album: Album | null,
  setAlbum: React.Dispatch<React.SetStateAction<Album | null>>,
  navigate: (path: string) => void,
  removeFromViewedAlbums?: (customId: string) => void
) => {
  const [editName, setEditName] = useState('');
  const [editModalOpened, setEditModalOpened] = useState(false);

  const startEditName = () => {
    setEditName(album?.name || '');
    setEditModalOpened(true);
  };

  const saveEditName = async () => {
    if (!editName.trim() || !album) return;
    
    try {
      const res = await fetch(`/api/albums/${album.custom_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      
      if (!res.ok) throw new Error('アルバム名の更新に失敗しました');
      
      const updated = await res.json();
      setAlbum((prev) => prev ? { ...prev, name: updated.name } : prev);
      setEditModalOpened(false);
      notifications.show({ title: '成功', message: 'アルバム名を変更しました', color: 'green' });
    } catch (e) {
      void e;
      notifications.show({ title: 'エラー', message: 'アルバム名の変更に失敗しました', color: 'red' });
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;
    if (!window.confirm('本当にこのアルバムを削除しますか？この操作は元に戻せません。')) return;
    
    try {
      const res = await fetch(`/api/albums/${album.custom_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      
      console.log('アルバム削除成功、閲覧履歴から削除中:', album.custom_id);
      if (removeFromViewedAlbums) {
        removeFromViewedAlbums(album.custom_id);
        console.log('閲覧履歴から削除完了:', album.custom_id);
      } else {
        console.log('removeFromViewedAlbums関数が見つからない');
      }
      
      notifications.show({ title: '削除完了', message: 'アルバムを削除しました', color: 'green' });
      navigate('/');
    } catch {
      notifications.show({ title: 'エラー', message: 'アルバムの削除に失敗しました', color: 'red' });
    }
  };

  return {
    editName,
    setEditName,
    editModalOpened,
    setEditModalOpened,
    startEditName,
    saveEditName,
    handleDeleteAlbum
  };
}; 
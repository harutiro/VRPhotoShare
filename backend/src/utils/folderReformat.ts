import { Client } from 'minio';
import { minio } from './minioClient';
import { pool } from '../db/pgPool';

interface Photo {
  id: number;
  album_id: number | null;
  filename: string;
  stored_filename: string;
  thumbnail_filename: string | null;
  custom_id?: string;
}

// ファイル移動関数
async function moveFile(
  client: Client,
  bucket: string,
  sourcePath: string,
  destinationPath: string
): Promise<boolean> {
  try {
    // ファイルが存在するかチェック
    await client.statObject(bucket, sourcePath);
    
    // ファイルをコピー
    await client.copyObject(bucket, destinationPath, `/${bucket}/${sourcePath}`);
    
    // 元ファイルを削除
    await client.removeObject(bucket, sourcePath);
    
    console.log(`✅ 移動完了: ${sourcePath} → ${destinationPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 移動失敗: ${sourcePath} → ${destinationPath}`, error);
    return false;
  }
}

// 新しいパスを生成する関数
function generateNewPaths(photo: Photo): { newStoredPath: string; newThumbnailPath: string | null } {
  // ファイル名を取得（既存のプレフィックスを除去）
  const getFileName = (path: string): string => {
    // 既存のプレフィックスを除去してファイル名のみを取得
    return path.split('/').pop() || path;
  };

  const storedFileName = getFileName(photo.stored_filename);
  const thumbnailFileName = photo.thumbnail_filename ? getFileName(photo.thumbnail_filename) : null;

  // アルバムIDがある場合とない場合で分岐
  if (photo.album_id && photo.custom_id) {
    // アルバムあり: albums/{custom_id}/
    const newStoredPath = `albums/${photo.custom_id}/${storedFileName}`;
    const newThumbnailPath = thumbnailFileName 
      ? `albums/${photo.custom_id}/thumbnails/${thumbnailFileName}`
      : null;
    return { newStoredPath, newThumbnailPath };
  } else {
    // アルバムなし: photos/
    const newStoredPath = `photos/${storedFileName}`;
    const newThumbnailPath = thumbnailFileName 
      ? `photos/thumbnails/${thumbnailFileName}`
      : null;
    return { newStoredPath, newThumbnailPath };
  }
}

// メイン移行処理
export async function reformatFolderStructure(): Promise<void> {
  console.log('📁 フォルダ構造移行を開始します...');
  
  const bucket = process.env.MINIO_BUCKET_NAME || 'vrphotoshare';
  let totalPhotos = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // アルバム情報と一緒に写真データを取得
    const query = `
      SELECT 
        p.id, 
        p.album_id, 
        p.filename, 
        p.stored_filename, 
        p.thumbnail_filename,
        a.custom_id
      FROM photos p
      LEFT JOIN albums a ON p.album_id = a.id
    `;
    
    const result = await pool.query(query);
    const photos: Photo[] = result.rows;
    totalPhotos = photos.length;

    console.log(`📊 移行対象の写真: ${totalPhotos}件`);

    for (const photo of photos) {
      console.log(`\n🔄 処理中: ID ${photo.id} - ${photo.filename}`);
      
      // 新しいパスを生成
      const { newStoredPath, newThumbnailPath } = generateNewPaths(photo);
      
      // 現在のパス（旧構造を想定）
      const currentStoredPath = photo.stored_filename;
      const currentThumbnailPath = photo.thumbnail_filename;

      let photoMoved = false;
      let thumbnailMoved = false;

      // メイン写真ファイルの移動
      if (currentStoredPath !== newStoredPath) {
        photoMoved = await moveFile(minio, bucket, currentStoredPath, newStoredPath);
      } else {
        console.log(`⏭️  写真は既に正しい場所にあります: ${currentStoredPath}`);
        photoMoved = true;
      }

      // サムネイルファイルの移動
      if (currentThumbnailPath && newThumbnailPath && currentThumbnailPath !== newThumbnailPath) {
        thumbnailMoved = await moveFile(minio, bucket, currentThumbnailPath, newThumbnailPath);
      } else if (currentThumbnailPath && newThumbnailPath) {
        console.log(`⏭️  サムネイルは既に正しい場所にあります: ${currentThumbnailPath}`);
        thumbnailMoved = true;
      } else {
        thumbnailMoved = true; // サムネイルがない場合はスキップ
      }

      // データベースのパスを更新
      if (photoMoved && thumbnailMoved) {
        try {
          const updateQuery = `
            UPDATE photos 
            SET stored_filename = $1, thumbnail_filename = $2
            WHERE id = $3
          `;
          await pool.query(updateQuery, [newStoredPath, newThumbnailPath, photo.id]);
          console.log(`✅ データベース更新完了: ID ${photo.id}`);
          successCount++;
        } catch (dbError) {
          console.error(`❌ データベース更新失敗: ID ${photo.id}`, dbError);
          errorCount++;
        }
      } else {
        console.error(`❌ ファイル移動失敗のためデータベース更新をスキップ: ID ${photo.id}`);
        errorCount++;
      }
    }

    console.log('\n🎉 フォルダ構造移行完了！');
    console.log(`📊 結果:`);
    console.log(`   - 総写真数: ${totalPhotos}`);
    console.log(`   - 成功: ${successCount}`);
    console.log(`   - エラー: ${errorCount}`);

  } catch (error) {
    console.error('❌ 移行処理中にエラーが発生しました:', error);
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  reformatFolderStructure().catch(console.error);
} 
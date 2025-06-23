-- 既存のテーブルを削除
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS albums;

-- アルバム情報を格納するテーブル
CREATE TABLE albums (
    id SERIAL PRIMARY KEY,
    custom_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 写真情報を格納するテーブル
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    album_id INT REFERENCES albums(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    image_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 
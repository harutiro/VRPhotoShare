export interface PngMetadata {
  description?: string;
  takenAt?: Date;
}

export function extractPngPackage(buffer: Buffer): string | null {
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    return null;
  }
  let offset = 8;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'PngP') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd).toString('utf8');
      return chunkData;
    }
    if (type === 'iTXt') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd);
      const nullIdx = chunkData.indexOf(0x00);
      if (nullIdx !== -1) {
        const keyword = chunkData.slice(0, nullIdx).toString('utf8');
        if (keyword === 'Description') {
          let ptr = nullIdx + 1;
          ptr += 1;
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++;
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++;
          if (ptr < chunkData.length) {
            const text = chunkData.slice(ptr).toString('utf8').split('\0')[0];
            return text;
          }
        }
      }
    }
    offset += 8 + length + 4;
  }
  return null;
}

export function extractPngMetadata(buffer: Buffer): PngMetadata {
  const metadata: PngMetadata = {};

  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    return metadata;
  }

  let offset = 8;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'PngP') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd).toString('utf8');
      metadata.description = chunkData;
    }
    
    if (type === 'iTXt') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd);
      const nullIdx = chunkData.indexOf(0x00);
      if (nullIdx !== -1) {
        const keyword = chunkData.slice(0, nullIdx).toString('utf8');
        
        if (keyword === 'Description') {
          let ptr = nullIdx + 1;
          ptr += 1;
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++;
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++;
          if (ptr < chunkData.length) {
            const text = chunkData.slice(ptr).toString('utf8').split('\0')[0];
            metadata.description = text;
          }
        }
        
        // VRChatの写真には通常 "Creation Time" や "DateTime" のキーワードが含まれている
        if (keyword === 'Creation Time' || keyword === 'DateTime') {
          let ptr = nullIdx + 1;
          ptr += 1; // compression flag
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++; // language tag
          ptr++;
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++; // translated keyword
          ptr++;
          if (ptr < chunkData.length) {
            const dateStr = chunkData.slice(ptr).toString('utf8').split('\0')[0];
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              metadata.takenAt = date;
            }
          }
        }
      }
    }
    
    // tEXt チャンクもチェック（非圧縮テキスト）
    if (type === 'tEXt') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd);
      const nullIdx = chunkData.indexOf(0x00);
      if (nullIdx !== -1) {
        const keyword = chunkData.slice(0, nullIdx).toString('utf8');
        const text = chunkData.slice(nullIdx + 1).toString('utf8');
        
        if (keyword === 'Creation Time' || keyword === 'DateTime') {
          const date = new Date(text);
          if (!isNaN(date.getTime())) {
            metadata.takenAt = date;
          }
        }
      }
    }
    
    offset += 8 + length + 4;
  }
  
  return metadata;
} 
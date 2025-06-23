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
            const text = chunkData.slice(ptr).toString('utf8');
            return text.replace(/\u0000/g, '');
          }
        }
      }
    }
    offset += 8 + length + 4;
  }
  return null;
} 
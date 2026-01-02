import { apiClient } from './client';
// Use import instead of require for consistent TypeScript behavior
const SparkMD5 = require('spark-md5');

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const getMimeType = (file: File): string => {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'svs': return 'image/svs';
    case 'ndpi': return 'image/ndpi';
    case 'dcm': return 'application/dicom';
    case 'tiff':
    case 'tif': return 'image/tiff';
    default: return 'application/octet-stream';
  }
};

const calculateIncrementalHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    let currentChunk = 0;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      currentChunk++;
      if (currentChunk < totalChunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    reader.onerror = () => reject("Hash calculation failed");

    const loadNext = () => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    };

    loadNext();
  });
};

export const filesApi = {
  uploadFile: async (file: File, category: string, onProgress: (p: number) => void) => {
    // 1. Calculate MD5 Hash Incrementally
    // This is the "fingerprint" used to resume the upload later if it fails
    const fileHash = await calculateIncrementalHash(file);

    // 2. Start/Resume Session Handshake
    const startRes = await apiClient.post('/files/upload-start', {
      fileName: file.name,
      fileType: getMimeType(file),
      totalSize: file.size,
      fileHash,
      category
    });
    
    // uploadedChunks tells us where to restart (0 for new, >0 for resumed)
    const { sessionId, totalChunks, uploadedChunks } = startRes.data.data;

    // 3. Sequential Chunk Upload
    // Note: 'i' starts at 'uploadedChunks' to support resumption
    for (let i = uploadedChunks; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      
      /** * CRITICAL: FIELD ORDER 
       * We append text fields BEFORE the file to ensure Multer 
       * parses the body before processing the file stream.
       */
      formData.append('sessionId', sessionId);
      formData.append('chunkNumber', i.toString());
      formData.append('file', chunk); // Must match upload.single('file') on backend

      try {
        await apiClient.post('/files/upload-chunk', formData, {
            // Explicitly set content type for multipart
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (error) {
        console.error(`Failed to upload chunk ${i}. The user can retry later.`);
        throw error; 
      }

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      onProgress(progress);
    }

    // 4. Complete Upload & Final Merge
    const completeRes = await apiClient.post('/files/upload-complete', {
      sessionId,
      fileHash // Sent again to verify final integrity
    });

    return completeRes.data.data.fileId;
  }
};
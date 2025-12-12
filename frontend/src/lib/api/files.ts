import { apiClient } from './client';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB matches backend

export const filesApi = {
  /**
   * Orchestrates the entire chunked upload process
   */
  uploadFile: async (
    file: File, 
    category: 'pathology' | 'radiology' | 'clinical' | 'genomic',
    onProgress: (progress: number) => void
  ): Promise<string> => {
    // 1. Calculate file hash (simplified for browser)
    // In prod, use a worker or crypto.subtle for large files
    const fileHash = `${file.name}-${file.size}-${file.lastModified}`;

    // 2. Start Session
    const startRes = await apiClient.post('/files/upload-start', {
      fileName: file.name,
      fileType: file.type,
      totalSize: file.size,
      fileHash,
      category
    });
    
    const { sessionId, totalChunks } = startRes.data.data;

    // 3. Upload Chunks
    for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
      const start = chunkNum * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('chunkNumber', chunkNum.toString());
      formData.append('file', chunk);

      await apiClient.post('/files/upload-chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Calculate progress
      const progress = Math.round(((chunkNum + 1) / totalChunks) * 100);
      onProgress(progress);
    }

    // 4. Complete Upload
    const completeRes = await apiClient.post('/files/upload-complete', {
      sessionId,
      fileHash
    });

    return completeRes.data.data.fileId;
  }
};

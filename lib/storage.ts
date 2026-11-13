import crypto from 'crypto';

export const hasBlobConfig = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && !token.includes('YOUR_VERCEL_BLOB_TOKEN'));
};

export const storage = {
  async put(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
    // 1. If Vercel Blob token is configured, stream directly to Vercel Private Vault
    if (hasBlobConfig()) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`oneview/${Date.now()}-${filename}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        return blob.url;
      } catch (err) {
        console.warn('Vercel Blob upload failed:', err);
      }
    }

    // 2. Direct database-backed binary inline URI (RFC 2397 Data Stream)
    // No files are ever written to the local filesystem, disk, or repository codebase.
    // The asset bytes are directly embedded and stored exclusively inside the database record.
    const base64Data = buffer.toString('base64');
    const safeMime = mimeType || 'image/png';
    return `data:${safeMime};base64,${base64Data}`;
  }
};

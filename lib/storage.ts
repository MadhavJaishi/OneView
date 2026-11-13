import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export const hasBlobConfig = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && !token.includes('YOUR_VERCEL_BLOB_TOKEN'));
};

export const storage = {
  async put(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (hasBlobConfig()) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`oneview/${Date.now()}-${filename}`, buffer, {
          access: 'public', // Or signed/private stream
          contentType: mimeType,
        });
        return blob.url;
      } catch (err) {
        console.warn('Vercel Blob upload failed, falling back to local vault buffer:', err);
      }
    }

    // Local file fallback stored in public/uploads for direct browser serving
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${crypto.randomBytes(8).toString('hex')}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    return `/uploads/${safeName}`;
  }
};

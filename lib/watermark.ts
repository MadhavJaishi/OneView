import sharp from 'sharp';

/**
 * Creates an SVG overlay containing a repeating diagonal pattern of watermark text.
 */
function createWatermarkSvg(width: number, height: number, watermarkText: string): Buffer {
  const sanitizedText = watermarkText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .toUpperCase();

  // Pattern tile dimensions
  const tileWidth = 320;
  const tileHeight = 180;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wmPattern" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
          <text 
            x="20" 
            y="90" 
            font-family="monospace, sans-serif" 
            font-size="16" 
            font-weight="bold" 
            fill="rgba(255, 255, 255, 0.45)" 
            stroke="rgba(0, 0, 0, 0.75)" 
            stroke-width="0.8"
            letter-spacing="2"
          >
            ${sanitizedText}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wmPattern)" />
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * Bakes a permanent, server-side watermark directly into the image pixel buffer.
 * The original unwatermarked image is never stored or transmitted to the client.
 */
export async function bakeServerWatermark(
  imageBuffer: Buffer,
  watermarkText: string,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 1200;
    const height = metadata.height || 800;

    const watermarkSvgBuffer = createWatermarkSvg(width, height, watermarkText);

    let pipeline = image.composite([
      {
        input: watermarkSvgBuffer,
        top: 0,
        left: 0,
        blend: 'over',
      },
    ]);

    // Format output
    if (metadata.format === 'jpeg' || mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      const outBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
      return { buffer: outBuffer, mimeType: 'image/jpeg' };
    } else if (metadata.format === 'webp' || mimeType.includes('webp')) {
      const outBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
      return { buffer: outBuffer, mimeType: 'image/webp' };
    } else {
      // Default to PNG
      const outBuffer = await pipeline.png().toBuffer();
      return { buffer: outBuffer, mimeType: 'image/png' };
    }
  } catch (err) {
    console.warn('Server watermark baking fallback to original:', err);
    return { buffer: imageBuffer, mimeType };
  }
}

import crypto from 'crypto';

interface ImgProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  enlarge?: boolean;
  blur?: number;
  resize?: 'fit' | 'fill' | 'crop' | 'fill-down';
  dpr?: number;
}

class ImgProxy {
  private baseUrl: string;
  private key: string;
  private salt: string;
  private bucketName: string;

  constructor() {
    this.baseUrl = process.env.IMGPROXY_URL || '';
    this.key = process.env.IMGPROXY_KEY || '';
    this.salt = process.env.IMGPROXY_SALT || '';
    this.bucketName = process.env.IMGPROXY_BUCKET_NAME || '';
  }

  /**
   * Сгенерировать URL для изображения в S3-бакете
   */
  getUrl(path: string, options: ImgProxyOptions = {}): string {
    const processing: string[] = [];
    
    if (options.resize) processing.push(`rt:${options.resize}`);
    if (options.width) processing.push(`w:${options.width}`);
    if (options.height) processing.push(`h:${options.height}`);
    if (options.dpr) processing.push(`dpr:${options.dpr}`);
    if (options.quality) processing.push(`q:${options.quality}`);
    if (options.blur) processing.push(`blur:${options.blur}`);
    if (options.format) processing.push(`f:${options.format}`);
    if (options.enlarge === false) processing.push(`el:0`);
    
    const processingString = processing.join('/');

    const sourceUrl = `s3://${this.bucketName}/${path}`;

    let url = `${this.baseUrl}/`;
    
    if (this.key && this.salt) {
      const signature = this.signUrl(processingString, sourceUrl);
      url += `${signature}/`;
    } else {
      url += 'unsafe/';
    }
    
    if (processingString) {
      url += `${processingString}/`;
    }
    
    url += `plain/${sourceUrl}`;
    
    return url;
  }

  private signUrl(processingString: string, sourceUrl: string): string {
    const path = `/${processingString}/plain/${sourceUrl}`;
    const hmac = crypto.createHmac('sha256', Buffer.from(this.key, 'hex'));
    hmac.update(Buffer.from(this.salt, 'hex'));
    hmac.update(Buffer.from(path));
    return hmac.digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

export const imgproxy = new ImgProxy();
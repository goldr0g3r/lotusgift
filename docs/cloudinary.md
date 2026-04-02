# Cloudinary Image Hosting

Lotus Gift uses [Cloudinary](https://cloudinary.com/) as its image hosting and CDN platform. Images uploaded through the admin dashboard are sent to Cloudinary, and only the resulting URLs are stored in the database.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                           │
│  ┌──────────────┐                                            │
│  │ File Picker  │──── multipart/form-data ───┐               │
│  └──────────────┘                            │               │
└──────────────────────────────────────────────┼───────────────┘
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  NestJS API (port 3001)                       │
│                                                              │
│  POST /api/upload ─── Multer (memoryStorage) ──┐             │
│                                                │             │
│  ┌──────────────────┐    buffer    ┌───────────▼───────────┐ │
│  │  CloudinaryService│◄────────────│  UploadController     │ │
│  │  .uploadImage()  │             └─────────────────────── │ │
│  └────────┬─────────┘                                       │
│           │ cloudinary.uploader.upload_stream()              │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────┐         ┌──────────────────────┐
│    Cloudinary CDN    │────────►│   Browser / next/image│
│  res.cloudinary.com  │  URL    │   (optimized delivery)│
└──────────────────────┘         └──────────────────────┘
            │
            │  { secure_url, public_id }
            ▼
┌──────────────────────┐
│     Database         │
│  (imageUrl = URL)    │
└──────────────────────┘
```

**Flow:** Admin selects a file → browser sends it to the NestJS upload endpoint → NestJS streams the buffer to Cloudinary → Cloudinary returns a CDN URL → the URL is saved in the database alongside the entity (product, category, banner, etc.).

## 1. Create a Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com/) (free tier: 25 credits/month)
2. From the **Dashboard**, note your credentials:
   - **Cloud Name** (e.g. `dxyz1abc2`)
   - **API Key** (numeric)
   - **API Secret**

## 2. Install Dependencies

### API (NestJS backend)

```bash
cd apps/api
pnpm add cloudinary multer
pnpm add -D @types/multer   # already present
```

- `cloudinary` — official Node.js SDK for upload and transformation APIs
- `multer` — multipart/form-data parser (memory storage, no disk writes)

### Web (Next.js frontend)

No additional packages are required. The admin upload component uses the native `fetch` API with `FormData`. If you later want Cloudinary's advanced Next.js image component:

```bash
cd apps/web
pnpm add next-cloudinary
```

## 3. Environment Variables

Add the following to `apps/api/.env`:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

All three are required for uploads to work. Without them, the upload endpoint returns a `503 Service Unavailable` error so the application still starts but upload functionality is disabled.

## 4. Backend Setup (NestJS)

### 4.1 Cloudinary Module

Create a reusable NestJS module that configures the Cloudinary SDK and exposes an upload service.

**`apps/api/src/cloudinary/cloudinary.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';

@Module({
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
```

### 4.2 Cloudinary Service

**`apps/api/src/cloudinary/cloudinary.service.ts`**

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.configured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary credentials missing — uploads disabled');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async uploadImage(
    buffer: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    if (!this.configured) {
      throw new Error('Cloudinary is not configured');
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `lotusgift/${folder}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
      stream.end(buffer);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured) return;
    await cloudinary.uploader.destroy(publicId);
  }
}
```

Key design decisions:
- **Memory storage** — files never touch disk; the buffer is streamed directly to Cloudinary.
- **Folder convention** — images are organized under `lotusgift/<entity>` (e.g. `lotusgift/products`, `lotusgift/banners`).
- **Auto-optimization** — Cloudinary automatically serves the best format (WebP/AVIF) and quality.

### 4.3 Upload Controller

**`apps/api/src/cloudinary/cloudinary.controller.ts`**

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ServiceUnavailableException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('Upload')
@Controller('upload')
export class CloudinaryController {
  constructor(private cloudinary: CloudinaryService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({ name: 'folder', required: false, example: 'products' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!this.cloudinary.isConfigured()) {
      throw new ServiceUnavailableException('Image uploads are not configured');
    }

    const result = await this.cloudinary.uploadImage(file.buffer, folder);
    return result;
  }
}
```

The endpoint is `POST /api/upload?folder=products`. It accepts `multipart/form-data` with a `file` field and returns:

```json
{
  "url": "https://res.cloudinary.com/dxyz1abc2/image/upload/v1234/lotusgift/products/abc123.webp",
  "publicId": "lotusgift/products/abc123"
}
```

### 4.4 Register the Module

Add `CloudinaryModule` to the root `AppModule` imports:

**`apps/api/src/app.module.ts`**

```typescript
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ... existing modules
    CloudinaryModule,
  ],
})
export class AppModule {}
```

## 5. Frontend Integration (Admin Dashboard)

### 5.1 Reusable Upload Component

Create a shared image upload component for all admin forms:

**`apps/web/app/admin/components/image-upload.tsx`**

```tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function ImageUpload({ value, onChange, folder = 'general', label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload?folder=${folder}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Upload failed');
      }

      const { url } = await res.json();
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {value ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click or drag an image</p>
              <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
```

### 5.2 Using in Admin Forms

Replace the `imageUrl` text input in any admin form with the `ImageUpload` component:

**Before (text input):**

```tsx
<input
  type="url"
  value={imageUrl}
  onChange={(e) => setImageUrl(e.target.value)}
  placeholder="https://..."
/>
```

**After (Cloudinary upload):**

```tsx
import { ImageUpload } from '../components/image-upload';

<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  folder="products"
  label="Product Image"
/>
```

The `folder` prop organizes images in Cloudinary by entity type:

| Admin Form | `folder` value |
|------------|----------------|
| Products | `products` |
| Categories | `categories` |
| Banners | `banners` |
| Testimonials | `testimonials` |
| Landing Pages | `landing-pages` |

### 5.3 Next.js Image Configuration

To use `next/image` with Cloudinary URLs, add the remote pattern to `apps/web/next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
```

## 6. Database Storage

Only the Cloudinary URL string is stored in the database. No schema changes are needed — the existing `imageUrl` fields already hold strings.

**Example — product creation flow:**

1. Admin uploads an image → receives `https://res.cloudinary.com/.../lotusgift/products/abc.webp`
2. Admin fills out the product form and submits
3. The `imageUrl` field in the POST body contains the Cloudinary URL
4. Mongoose stores it in the `Product.imageUrl` field

```
Product {
  id: "clx...",
  name: "Gift Hamper",
  imageUrl: "https://res.cloudinary.com/dxyz/image/upload/v1234/lotusgift/products/abc.webp",
  ...
}
```

The same pattern applies to `Category.imageUrl`, `Banner.imageUrl`, `Testimonial.imageUrl`, `LandingPage.imageUrl`, and `ProductImage.url`.

### MongoDB Compatibility

When migrating to MongoDB, this approach works identically. The `imageUrl` field becomes a string field in a MongoDB document:

```json
{
  "_id": "ObjectId(...)",
  "name": "Gift Hamper",
  "imageUrl": "https://res.cloudinary.com/dxyz/image/upload/v1234/lotusgift/products/abc.webp",
  "images": [
    {
      "url": "https://res.cloudinary.com/.../front.webp",
      "alt": "Front view",
      "sortOrder": 0
    }
  ]
}
```

No change to the upload flow, Cloudinary configuration, or admin components is needed — only the database adapter changes.

## 7. Cloudinary URL Transformations

One advantage of storing Cloudinary URLs is on-the-fly image transformation. Instead of uploading multiple sizes, transform at the URL level:

```
Original:
https://res.cloudinary.com/dxyz/image/upload/v1234/lotusgift/products/abc.webp

Thumbnail (200×200, cropped):
https://res.cloudinary.com/dxyz/image/upload/w_200,h_200,c_fill/v1234/lotusgift/products/abc.webp

Banner (1200 wide, auto height):
https://res.cloudinary.com/dxyz/image/upload/w_1200,c_scale,q_auto,f_auto/v1234/lotusgift/products/abc.webp
```

Useful helper for the frontend:

```typescript
export function cloudinaryUrl(url: string, transforms: string): string {
  return url.replace('/upload/', `/upload/${transforms}/`);
}

// Usage
cloudinaryUrl(product.imageUrl, 'w_400,h_400,c_fill,q_auto,f_auto');
```

## 8. File Structure After Setup

```
apps/api/src/
├── cloudinary/
│   ├── cloudinary.module.ts
│   ├── cloudinary.service.ts
│   └── cloudinary.controller.ts
└── ...

apps/web/app/admin/
├── components/
│   └── image-upload.tsx
└── ...
```

## 9. Testing the Upload

1. Start both apps: `pnpm dev`
2. Open Swagger at `http://localhost:3001/api/docs`
3. Find the `Upload` section → `POST /api/upload`
4. Upload a test image with `folder=products`
5. Verify the response contains a `url` starting with `https://res.cloudinary.com/`
6. Open the URL in a browser to confirm the image is served via Cloudinary's CDN

## 10. Production Checklist

- [ ] Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in your deployment platform's secret manager
- [ ] Verify the upload endpoint is protected by `BetterAuthGuard` (it is by default — the global guard applies to all non-`@Public()` routes)
- [ ] Configure Cloudinary upload presets for additional security (optional)
- [ ] Set up a [Cloudinary webhook](https://cloudinary.com/documentation/notifications) for monitoring upload activity (optional)
- [ ] Consider enabling [Cloudinary's eager transformations](https://cloudinary.com/documentation/transformations_on_upload) if you need pre-generated thumbnails

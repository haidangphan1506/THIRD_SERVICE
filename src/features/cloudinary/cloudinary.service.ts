import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

import { CLOUDINARY } from './cloudinary.constant';
import { type MulterFile, UploadFileOptions } from './cloudinary.interface';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY)
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  upload(file: MulterFile, options?: UploadFileOptions): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions = { folder: 'tutors', timeout: 120000, ...options };
      const stream = this.cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(error.message ?? 'Cloudinary upload failed'));
        resolve(result as UploadApiResponse);
      });

      Readable.from(file.buffer).pipe(stream);
    });
  }

  delete(publicId: string): Promise<unknown> {
    return this.cloudinary.uploader.destroy(publicId);
  }
}

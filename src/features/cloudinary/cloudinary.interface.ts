import { UploadApiOptions } from 'cloudinary';

export type UploadFileOptions = UploadApiOptions;

export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding: string;
}

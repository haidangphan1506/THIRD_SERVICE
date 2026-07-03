export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname: string;
  encoding: string;
}

export interface UploadResponse {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

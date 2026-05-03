export interface ApiResponseInterface<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: Date;
  method: string;
  path: string;
}

export interface ApiResponseOptions {
  message?: string;
  statusCode?: number;
}

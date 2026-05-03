import { SetMetadata } from '@nestjs/common';
import { ApiResponseOptions } from '@packages/interfaces';

export const API_RESPONSE_KEY = 'api_response';

export const ApiResponse = (options: ApiResponseOptions) => SetMetadata(API_RESPONSE_KEY, options);

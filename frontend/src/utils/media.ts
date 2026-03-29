const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || '/api');

const MEDIA_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_MEDIA_URL || import.meta.env.VITE_API_URL || ''
);

export const resolveMediaUrl = (filePath?: string | null) => {
  if (!filePath) return '';

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  if (!MEDIA_BASE_URL) {
    return filePath;
  }

  return `${MEDIA_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};
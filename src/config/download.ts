export interface AeroDownloadConfig {
  filename: string;
  url: string;
  version: string;
  platform: string;
  size: string;
  hash: string;
  releaseDate: string;
}

export const AERO_DOWNLOAD_CONFIG: AeroDownloadConfig = {
  filename: 'AERO_CLIENT_V2.8.exe',
  url: '/downloads/AERO_CLIENT_V2.8.exe',
  version: '2.8.4-PROD',
  platform: 'WINDOWS 10 / 11 (x64)',
  size: '48.2 MB',
  hash: 'SHA256: 8F4E2D1A9C0B3E7F4B6D8C2E0A1F3B5D7E9A2C4F6B8D0E1A3C5E7F9B1D3F5A7C',
  releaseDate: 'NOVEMBER 2026',
};

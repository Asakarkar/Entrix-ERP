const useRemoteBackend =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE === 'remote';
const configuredBackendUrl = import.meta.env.VITE_BACKEND_SERVER;

const withTrailingSlash = (url) => `${url.replace(/\/+$/, '')}/`;

if (useRemoteBackend && !configuredBackendUrl) {
  throw new Error('VITE_BACKEND_SERVER must be configured for remote builds.');
}

const backendBaseUrl = useRemoteBackend
  ? withTrailingSlash(configuredBackendUrl)
  : 'http://localhost:8888/';

export const API_BASE_URL = `${backendBaseUrl}api/`;
export const BASE_URL = backendBaseUrl;

export const WEBSITE_URL = import.meta.env.PROD
  ? `${window.location.origin}/`
  : 'http://localhost:3000/';
export const DOWNLOAD_BASE_URL = `${backendBaseUrl}download/`;
export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL
  ? withTrailingSlash(import.meta.env.VITE_FILE_BASE_URL)
  : backendBaseUrl;

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );

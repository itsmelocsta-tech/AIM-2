import { GoogleDriveFile, DriveSyncState } from '../types';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
const STORAGE_TOKEN_KEY = 'aim_google_drive_token';
const STORAGE_USER_KEY = 'aim_google_drive_user';

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const driveService = {
  getStoredState(): Partial<DriveSyncState> {
    const token = safeStorage.getItem(STORAGE_TOKEN_KEY);
    const userEmail = safeStorage.getItem(STORAGE_USER_KEY);
    return {
      isConnected: Boolean(token && !token.startsWith('aim_gdrive_session')),
      accessToken: token && !token.startsWith('aim_gdrive_session') ? token : null,
      userEmail: userEmail || null,
      lastSyncTime: safeStorage.getItem('aim_last_drive_sync') || null,
      syncedFiles: JSON.parse(safeStorage.getItem('aim_drive_synced_files') || '[]'),
      isLoading: false,
    };
  },

  saveToken(token: string, email?: string) {
    safeStorage.setItem(STORAGE_TOKEN_KEY, token);
    if (email) safeStorage.setItem(STORAGE_USER_KEY, email);
    safeStorage.setItem('aim_last_drive_sync', new Date().toISOString());
  },

  disconnect() {
    safeStorage.removeItem(STORAGE_TOKEN_KEY);
    safeStorage.removeItem(STORAGE_USER_KEY);
    safeStorage.removeItem('aim_last_drive_sync');
  },

  async requestAccessToken(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }

      const activeClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      if (!activeClientId) {
        reject(new Error('Google OAuth client ID is not configured. Please supply a valid Google OAuth Client ID to connect your Google Drive.'));
        return;
      }

      // Check if google client is loaded
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: DRIVE_SCOPES,
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(`Google OAuth error: ${response.error_description || response.error}`));
                return;
              }
              if (response.access_token) {
                this.saveToken(response.access_token);
                resolve(response.access_token);
              } else {
                reject(new Error('No access token returned from Google authentication'));
              }
            },
          });
          client.requestAccessToken();
        } catch (e: any) {
          reject(new Error(`Google OAuth initialization failed: ${e.message || e}`));
        }
      } else {
        reject(new Error('Google Identity Services library is not loaded. Please ensure Google API script is accessible.'));
      }
    });
  },

  async exportDocumentToDrive(params: {
    title: string;
    content: string;
    folderName?: string;
    mimeType?: string;
  }): Promise<{ success: boolean; file?: GoogleDriveFile; downloadUrl?: string; message: string }> {
    const token = safeStorage.getItem(STORAGE_TOKEN_KEY);

    // If real Drive API token is active and valid:
    if (token && !token.startsWith('aim_gdrive_session')) {
      try {
        const metadata = {
          name: `${params.title}.md`,
          mimeType: 'text/markdown',
          description: 'Exported from AIM Life Operating System',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: text/markdown\r\n\r\n' +
          params.content +
          close_delim;

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });

        if (res.ok) {
          const fileData = await res.json();
          const syncedFile: GoogleDriveFile = {
            id: fileData.id,
            name: metadata.name,
            mimeType: 'text/markdown',
            webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
            modifiedTime: new Date().toISOString(),
          };

          const existing: GoogleDriveFile[] = JSON.parse(safeStorage.getItem('aim_drive_synced_files') || '[]');
          existing.unshift(syncedFile);
          safeStorage.setItem('aim_drive_synced_files', JSON.stringify(existing.slice(0, 30)));
          safeStorage.setItem('aim_last_drive_sync', new Date().toISOString());

          return {
            success: true,
            file: syncedFile,
            message: `Document "${params.title}" exported directly to your Google Drive!`,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            message: `Google Drive API returned error: ${errData.error?.message || res.statusText}`,
          };
        }
      } catch (e: any) {
        return {
          success: false,
          message: `Network error exporting to Google Drive: ${e.message || e}`,
        };
      }
    }

    return {
      success: false,
      message: 'Google Drive is not connected with a verified OAuth token. Connect your Google account first.',
    };
  },

  async listFiles(): Promise<GoogleDriveFile[]> {
    const token = safeStorage.getItem(STORAGE_TOKEN_KEY);
    if (token && !token.startsWith('aim_gdrive_session')) {
      try {
        const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,modifiedTime)', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.files || [];
        }
      } catch (e) {
        console.warn('Drive list files error:', e);
      }
    }
    return JSON.parse(safeStorage.getItem('aim_drive_synced_files') || '[]');
  },
};

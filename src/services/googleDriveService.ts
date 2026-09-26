/**
 * Serviço de integração com Google Drive (Google Workspace API).
 * Permite salvar fotos comprovatórias e relatórios diários em PDF diretamente
 * no Google Drive do usuário/empresa, mantendo todos os arquivos fora do código
 * e do ambiente local.
 */

import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const DRIVE_FOLDER_NAME = 'Zeladoria Pro - Documentos e Fotos';
const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';

// Cache em memória para o Access Token (NUNCA persistido em localStorage, conforme segurança de Workspace)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;

// Ouvinte para invalidar o token em memória caso ocorra logout
if (typeof window !== 'undefined' && auth) {
  try {
    onAuthStateChanged(auth, (user) => {
      cachedGoogleUser = user;
      if (!user) {
        cachedAccessToken = null;
      }
    });
  } catch {}
}

export function isDriveConnected(): boolean {
  return Boolean(cachedAccessToken);
}

export function getCachedGoogleUser(): User | null {
  return cachedGoogleUser;
}

/**
 * Inicia a autenticação com Google para obter autorização no Google Drive.
 */
export async function connectGoogleDrive(): Promise<{ user: User; accessToken: string } | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope(SCOPE_DRIVE_FILE);
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    // Quando o usuário fecha ou cancela a janela pop-up, tratamos graciosamente sem emitir console.error
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.info('[GoogleDrive] Janela de login fechada pelo usuário.');
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      console.warn('[GoogleDrive] A janela pop-up foi bloqueada pelo navegador.');
      throw new Error('A janela pop-up foi bloqueada pelo navegador. Permita pop-ups para este site para conectar o Google Drive.');
    }

    console.error('[GoogleDrive] Erro na autenticação com o Google:', error);
    throw error;
  }
}

export function disconnectGoogleDrive(): void {
  cachedAccessToken = null;
  cachedGoogleUser = null;
}

/**
 * Obtém ou cria a pasta no Google Drive do usuário para organizar os arquivos da zeladoria.
 */
async function getOrCreateDriveFolder(accessToken: string, folderName = DRIVE_FOLDER_NAME): Promise<string | null> {
  try {
    // 1. Verificar se a pasta já existe
    const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
    }

    // 2. Se não existir, criar a pasta
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
  } catch (err) {
    console.warn('[GoogleDrive] Aviso ao verificar/criar pasta, salvando na raiz do Drive:', err);
  }

  return null;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
}

/**
 * Realiza upload de arquivo (Blob ou File) via API Multipart do Google Drive v3.
 */
export async function uploadFileToDrive(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  folderName = DRIVE_FOLDER_NAME
): Promise<DriveUploadResult> {
  if (!cachedAccessToken) {
    throw new Error('Google Drive não está conectado. Conecte sua conta Google antes de realizar o envio.');
  }

  const parentFolderId = await getOrCreateDriveFolder(cachedAccessToken, folderName);

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Converter Blob em arrayBuffer para envio
  const fileArrayBuffer = await fileBlob.arrayBuffer();

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const mediaHeaderBytes = encoder.encode(mediaHeader);
  const closeDelimiterBytes = encoder.encode(closeDelimiter);

  const totalLength = metadataBytes.byteLength + mediaHeaderBytes.byteLength + fileArrayBuffer.byteLength + closeDelimiterBytes.byteLength;
  const uint8Array = new Uint8Array(totalLength);

  let offset = 0;
  uint8Array.set(metadataBytes, offset);
  offset += metadataBytes.byteLength;
  uint8Array.set(mediaHeaderBytes, offset);
  offset += mediaHeaderBytes.byteLength;
  uint8Array.set(new Uint8Array(fileArrayBuffer), offset);
  offset += fileArrayBuffer.byteLength;
  uint8Array.set(closeDelimiterBytes, offset);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: uint8Array,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[GoogleDrive] Falha no upload:', errorBody);
    throw new Error(`Falha no upload para o Google Drive: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    webContentLink: result.webContentLink,
  };
}

/**
 * Converte base64 (Data URL) para Blob e envia ao Google Drive.
 */
export async function uploadBase64ImageToDrive(
  dataUrl: string,
  fileName: string
): Promise<DriveUploadResult> {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  const blob = new Blob([new Uint8Array(array)], { type: mimeType });

  return uploadFileToDrive(blob, fileName, mimeType, `${DRIVE_FOLDER_NAME}/Fotos Comprovatórias`);
}

/**
 * Envia um documento PDF para o Google Drive.
 */
export async function uploadPdfToDrive(
  pdfBlob: Blob,
  fileName: string,
  folderName: string = `${DRIVE_FOLDER_NAME}/Relatórios Diários`
): Promise<DriveUploadResult> {
  return uploadFileToDrive(pdfBlob, fileName, 'application/pdf', folderName);
}

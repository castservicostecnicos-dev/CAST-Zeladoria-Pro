/**
 * Utilitário de compressão e redimensionamento de imagens para Zeladoria Pro.
 * Garante que fotos tiradas por câmeras de alta resolução (que chegam a 5MB-15MB)
 * sejam reduzidas para dimensões seguras (~1024px) e qualidade otimizada (~70-120KB),
 * evitando estouro da cota do LocalStorage e respeitando o limite de 1MB por documento do Firestore.
 */

export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    const processImage = (img: HTMLImageElement) => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Redimensionar mantendo a proporção de tela
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Preenchimento de fundo para formatos transparentes (ex: PNG convertido para JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Exportar como JPEG com compressão controlada
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('[ImageCompression] Erro durante o processamento do canvas:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      processImage(img);
    };

    img.onerror = (err) => {
      console.warn('[ImageCompression] Erro ao carregar imagem para compressão:', err);
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = (e) => {
        console.warn('[ImageCompression] Erro no FileReader:', e);
        resolve('');
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

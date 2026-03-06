import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface ImgbbResponse {
  data: {
    id: string;
    url: string;
    display_url: string;
    thumb: { url: string };
    medium: { url: string };
    delete_url: string;
  };
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImgbbService {
  private apiUrl = environment.imgbb.uploadUrl;
  private apiKey = environment.imgbb.apiKey;

  constructor(private http: HttpClient) {}

  /**
   * Sube una imagen a ImgBB y retorna la URL permanente.
   * Comprime automáticamente si supera 2MB.
   */
  async uploadImage(file: File, name?: string): Promise<string> {
    // Comprimir si es necesario
    const processedFile = file.size > 2 * 1024 * 1024
      ? await this.compressImage(file)
      : file;

    const formData = new FormData();
    formData.append('key', this.apiKey);
    formData.append('image', processedFile);
    if (name) formData.append('name', name);

    const response = await firstValueFrom(
      this.http.post<ImgbbResponse>(this.apiUrl, formData)
    );

    if (!response.success) {
      throw new Error('Error al subir imagen a ImgBB');
    }

    return response.data.display_url;
  }

  /**
   * Sube múltiples imágenes y retorna array de URLs.
   */
  async uploadMultiple(files: File[]): Promise<string[]> {
    const uploads = files.map(file => this.uploadImage(file));
    return Promise.all(uploads);
  }

  /**
   * Comprime una imagen usando Canvas antes de subirla.
   */
  private compressImage(file: File, quality = 0.7): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          let { width, height } = img;
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}

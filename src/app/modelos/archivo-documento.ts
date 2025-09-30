import { MetadataImagen } from './metadata-imagen';

export interface ArchivoDocumento {
  readonly url: string;
  readonly nombreOriginal: string;
  readonly tamanioBytes: number;
  readonly tipoMime: string;
  readonly hash: string; // Para detectar duplicados
  readonly metadataImagen?: MetadataImagen;
}

import type { ImageMetadata, UnresolvedImageTransform } from '../types.js';
import { isRemotePath } from '@astrojs/internal-helpers/path';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}

export function isRemoteImage(src: ImageMetadata | string): src is string {
	return typeof src === 'string' && isRemotePath(src);
}

export async function resolveSrc(src: UnresolvedImageTransform['src']) {
	return typeof src === 'object' && 'then' in src ? (await src).default ?? (await src) : src;
}

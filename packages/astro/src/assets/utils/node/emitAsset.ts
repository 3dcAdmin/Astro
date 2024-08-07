import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as vite from 'vite';
import { prependForwardSlash, slash } from '../../../core/path.js';
import type { ImageMetadata } from '../../types.js';
import { imageMetadata } from '../metadata.js';

type FileEmitter = vite.Rollup.EmitFile;

export async function emitESMImage(
	id: string | undefined,
	/** @deprecated */
	_watchMode: boolean,
	// FIX: in Astro 5, this function should not be passed in dev mode at all.
	// Or rethink the API so that a function that throws isn't passed through.
	fileEmitter?: FileEmitter,
): Promise<ImageMetadata | undefined> {
	if (!id) {
		return undefined;
	}

	const url = pathToFileURL(id);
	let fileData: Buffer;
	try {
		fileData = await fs.readFile(url);
	} catch (err) {
		return undefined;
	}

	const fileMetadata = await imageMetadata(fileData, id);

	const emittedImage: Omit<ImageMetadata, 'fsPath'> = {
		src: '',
		...fileMetadata,
	};

	// Private for now, we generally don't want users to rely on filesystem paths, but we need it so that we can maybe remove the original asset from the build if it's unused.
	Object.defineProperty(emittedImage, 'fsPath', {
		enumerable: false,
		writable: false,
		value: id,
	});

	// Build
	let isBuild = typeof fileEmitter === 'function';
	if (isBuild) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${fileMetadata.format}`);

		try {
			// fileEmitter throws in dev
			const handle = fileEmitter!({
				name: filename,
				source: await fs.readFile(url),
				type: 'asset',
			});

			emittedImage.src = `__ASTRO_ASSET_IMAGE__${handle}__`;
		} catch {
			isBuild = false;
		}
	}

	if (!isBuild) {
		// Pass the original file information through query params so we don't have to load the file twice
		url.searchParams.append('origWidth', fileMetadata.width.toString());
		url.searchParams.append('origHeight', fileMetadata.height.toString());
		url.searchParams.append('origFormat', fileMetadata.format);

		emittedImage.src = `/@fs` + prependForwardSlash(fileURLToNormalizedPath(url));
	}

	return emittedImage as ImageMetadata;
}

function fileURLToNormalizedPath(filePath: URL): string {
	// Uses `slash` instead of Vite's `normalizePath` to avoid CJS bundling issues.
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}

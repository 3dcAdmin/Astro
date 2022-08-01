import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'tiny-glob';
import { ensureDir } from '../utils/paths.js';

async function globImages(dir: URL) {
	const srcPath = fileURLToPath(dir);
	return await glob(`${srcPath}/**/*.{heic,heif,avif,jpeg,jpg,png,tiff,webp,gif}`, {
		absolute: true,
	});
}

export interface SSRBuildParams {
	srcDir: URL;
	outDir: URL;
}

export async function ssrBuild({ srcDir, outDir }: SSRBuildParams) {
	const images = await globImages(srcDir);

	for await (const image of images) {
		const to = image.replace(fileURLToPath(srcDir), fileURLToPath(outDir));

		await ensureDir(path.dirname(to));
		await fs.copyFile(image, to);
	}
}

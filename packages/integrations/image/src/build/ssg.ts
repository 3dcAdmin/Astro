import { doWork } from '@altano/tiny-async-pool';
import type { AstroConfig } from 'astro';
import { bgGreen, black, cyan, dim, green, yellow } from 'kleur/colors';
import fs from 'node:fs/promises';
import OS from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SSRImageService, TransformOptions } from '../loaders/index.js';
import { loadLocalImage, loadRemoteImage } from '../utils/images.js';
import { debug, info, LoggerLevel, warn } from '../utils/logger.js';
import { isRemoteImage } from '../utils/paths.js';
import { transformBuffer } from '@astrojs/fs';
import { getCacheMetatadataFromTransformOptions } from '../utils/getCacheMetatadataFromTransformOptions.js';
import type { TCachedImageMetadata } from '../types.js';

function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}

export interface SSGBuildParams {
	loader: SSRImageService;
	staticImages: Map<string, Map<string, TransformOptions>>;
	config: AstroConfig;
	outDir: URL;
	logLevel: LoggerLevel;
	cacheEnabled: boolean;
}

export async function ssgBuild({
	loader,
	staticImages,
	config,
	outDir,
	logLevel,
	cacheEnabled,
}: SSGBuildParams) {
	const timer = performance.now();
	const cpuCount = OS.cpus().length;

	info({
		level: logLevel,
		prefix: false,
		message: `${bgGreen(
			black(
				` optimizing ${staticImages.size} image${
					staticImages.size > 1 ? 's' : ''
				} in batches of ${cpuCount} `
			)
		)}`,
	});

	const inputFiles = new Set<string>();

	async function processStaticImage([src, transformsMap]: [
		string,
		Map<string, TransformOptions>
	]): Promise<void> {
		let inputFile: string | undefined = undefined;
		let loadedBuffer: Buffer | undefined = undefined;

		// Vite will prefix a hashed image with the base path, we need to strip this
		// off to find the actual file relative to /dist
		if (config.base && src.startsWith(config.base)) {
			src = src.substring(config.base.length - 1);
		}

		if (isRemoteImage(src)) {
			// try to load the remote image
			loadedBuffer = await loadRemoteImage(src);
		} else {
			const inputFileURL = new URL(`.${src}`, outDir);
			inputFile = fileURLToPath(inputFileURL);
			loadedBuffer = await loadLocalImage(inputFile);

			// track the local file used so the original can be copied over
			inputFiles.add(inputFile);
		}

		if (!loadedBuffer) {
			// eslint-disable-next-line no-console
			warn({ level: logLevel, message: `"${src}" image could not be fetched` });
			return;
		}

		const inputBuffer = loadedBuffer;
		const transforms = Array.from(transformsMap.entries());

		debug({ level: logLevel, prefix: false, message: `${green('▶')} transforming ${src}` });
		let timeStart = performance.now();

		// process each transformed version
		for (const [filename, transform] of transforms) {
			timeStart = performance.now();
			let outputFile: string;

			if (isRemoteImage(src)) {
				const outputFileURL = new URL(path.join('./assets', path.basename(filename)), outDir);
				outputFile = fileURLToPath(outputFileURL);
			} else {
				const outputFileURL = new URL(path.join('./assets', filename), outDir);
				outputFile = fileURLToPath(outputFileURL);
			}

			const { output, wasCacheUsed } = await transformBuffer<TCachedImageMetadata>({
				input: inputBuffer,
				transformMetadata: getCacheMetatadataFromTransformOptions(transform),
				transformFn: async () => {
					// console.log(`ssg`, { transform });
					const { data, format } = await loader.transform(inputBuffer, transform);
					return { output: data, metadata: { format } };
				},
				enableCache: cacheEnabled,
			});

			await fs.writeFile(outputFile, output);

			const timeEnd = performance.now();
			const timeChange = getTimeStat(timeStart, timeEnd);
			const timeIncrease = `(+${timeChange})`;
			const pathRelative = outputFile.replace(fileURLToPath(outDir), '');
			debug({
				level: logLevel,
				prefix: false,
				message: `  ${cyan('created')} ${dim(
					`${pathRelative} ${timeIncrease} ${wasCacheUsed ? green('[from cache]') : ''}`
				)}`,
			});
		}
	}

	// transform each original image file in batches
	await doWork(cpuCount, staticImages, processStaticImage);

	info({
		level: logLevel,
		prefix: false,
		message: dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`),
	});
}

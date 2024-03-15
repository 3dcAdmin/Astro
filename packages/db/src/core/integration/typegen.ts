import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { DB_TYPES_FILE, RUNTIME_IMPORT } from '../consts.js';
import type { DBTable, DBTables } from '../types.js';

export async function typegen({ tables, root }: { tables: DBTables; root: URL }) {
	const content = `// This file is generated by \`studio sync\`
declare module 'astro:db' {
	export const db: import(${RUNTIME_IMPORT}).SqliteDB;
	export const dbUrl: string;

${Object.entries(tables)
	.map(([name, collection]) => generateTableType(name, collection))
	.join('\n')}
}
`;

	const dotAstroDir = new URL('.astro/', root);

	if (!existsSync(dotAstroDir)) {
		await mkdir(dotAstroDir);
	}

	await writeFile(new URL(DB_TYPES_FILE, dotAstroDir), content);
}

function generateTableType(name: string, collection: DBTable): string {
	const sanitizedColumnsList = Object.entries(collection.columns)
		// Filter out deprecated columns from the typegen, so that they don't
		// appear as queryable fields in the generated types / your codebase.
		.filter(([key, val]) => !val.schema.deprecated);
	const sanitizedColumns = Object.fromEntries(sanitizedColumnsList);
	let tableType = `	export const ${name}: import(${RUNTIME_IMPORT}).Table<
		${JSON.stringify(name)},
		${JSON.stringify(sanitizedColumns)}
	>;`;
	return tableType;
}

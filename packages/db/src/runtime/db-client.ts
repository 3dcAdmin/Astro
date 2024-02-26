import type { InStatement } from '@libsql/client';
import { createClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { z } from 'zod';

const isWebContainer = !!process.versions?.webcontainer;

interface LocalDatabaseClient extends LibSQLDatabase, Disposable {}

export async function createLocalDatabaseClient({
	dbUrl,
}: {
	dbUrl: string;
}): Promise<LocalDatabaseClient> {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	const client = createClient({ url });
	const db = Object.assign(drizzleLibsql(client), {
		[Symbol.dispose || Symbol.for('Symbol.dispose')]() {
			client.close();
		},
	});

	return db;
}

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	const url = new URL('/db/query', remoteDbURL);

	const db = drizzleProxy(async (sql, parameters, method) => {
		const requestBody: InStatement = { sql, args: parameters };
		// eslint-disable-next-line no-console
		console.info(JSON.stringify(requestBody));
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${appToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
		if (!res.ok) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: ${res.status} ${await res.text()}}`
			);
		}

		const queryResultSchema = z.object({
			rows: z.array(z.unknown()),
		});
		let rows: unknown[];
		try {
			const json = await res.json();
			rows = queryResultSchema.parse(json).rows;
		} catch (e) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: Unexpected JSON response. ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}

		// Drizzle expects each row as an array of its values
		const rowValues: unknown[][] = [];

		for (const row of rows) {
			if (row != null && typeof row === 'object') {
				rowValues.push(Object.values(row));
			}
		}

		if (method === 'get') {
			return { rows: rowValues[0] };
		}

		return { rows: rowValues };
	});
	return db;
}

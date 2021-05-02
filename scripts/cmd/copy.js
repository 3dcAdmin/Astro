import { promises as fs } from 'fs';
import { resolve, dirname, sep, join } from 'path';
import arg from 'arg';
import glob from 'globby';
import tar from 'tar';

/** @type {import('arg').Spec} */
const spec = {
  '--tgz': Boolean,
};

export default async function copy() {
  let { _: patterns, ['--tgz']: isCompress } = arg(spec);
  patterns = patterns.slice(1);

  if (isCompress) {
    const files = await glob(patterns, { gitignore: true });
    const rootDir = resolveRootDir(files);

    const templates = files.reduce((acc, curr) => {
      const name = curr.replace(rootDir, '').slice(1).split(sep)[0];
      if (acc[name]) {
        acc[name].push(resolve(curr));
      } else {
        acc[name] = [resolve(curr)];
      }
      return acc;
    }, {});

    return Promise.all(
      Object.entries(templates).map(([template, files]) => {
        const dest = resolve(join(rootDir.replace(/^[^/]+/, 'dist'), `${template}.tgz`));
        return fs.mkdir(dirname(dest), { recursive: true }).then(() => tar.c({ gzip: true, file: dest }, files));
      })
    );
  }

  const files = await glob(patterns);
  await Promise.all(files.map(file => {
      const dest = resolve(file.replace(/^[^/]+/, 'dist'));
      return fs.mkdir(dirname(dest), { recursive: true }).then(() => fs.copyFile(resolve(file), dest))
  }));
}

function resolveRootDir(files) {
  return files
    .reduce((acc, curr) => {
      const currParts = curr.split(sep);
      if (acc.length === 0) return currParts;
      const result = [];
      currParts.forEach((part, i) => {
        if (acc[i] === part) result.push(part);
      });
      return result;
    }, [])
    .join(sep);
}

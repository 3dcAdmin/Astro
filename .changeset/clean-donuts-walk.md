---
'@astrojs/markdown-remark': major
'astro': major
---

Cleans up Astro-specfic metadata attached to `vfile.data` in Remark and Rehype plugins. Previously, the metadata is attached in different locations with inconsistent names. The metadata is now renamed as below:

- `vfile.data.__astroHeadings` -> `vfile.data.astro.headings`
- `vfile.data.imagePaths` -> `vfile.data.astro.imagePaths`
- `vfile.data.astro.frontmatter` -> `vfile.data.astro.frontmatter`

The types of `imagePaths` has also been updated from `Set<string>` to `string[]`.

While we don't consider these APIs public, it can be accessed by Remark and Rehype plugins that wants to re-use Astro's metadata. If you are using these APIs, make sure to access them in the new locations.

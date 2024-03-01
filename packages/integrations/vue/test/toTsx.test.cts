import { toTSX } from '../src/editor.cts';
import {  describe, it } from 'node:test';
import { strictEqual } from 'node:assert'

describe('toTSX function', () => {
	it('should correctly transform Vue code to TSX with comments', () => {
    const vueCode = `
      <template>
        <div>{{ msg }}</div>
      </template>

      <script setup>
        // This is a comment in script setup
        // defineProps(['msg']);
				// console.log('foo)
      </script>
    `;

    const className = 'MyComponent';
    const result = toTSX(vueCode, className);

    // Replace the expectations below with the expected result based on your logic
		strictEqual(result, `export default function ${className}__AstroComponent_(_props: Record<string, any>): any {}`)
  });
	it('should correctly transform Vue code to TSX', () => {
    const vueCode = `
      <template>
        <div @click="handleClick">{{ msg }}</div>
      </template>

      <script setup>
        const props defineProps({
					msg: String
				});
				const handleClick = () => {
					console.log('foo');
				}
      </script>
    `;

    const className = 'MyComponent';
    const result = toTSX(vueCode, className);
		strictEqual(result.replace(/\s/g, ''), `import{defineProps}from'vue';constProps=defineProps({msg:String})exportdefaultfunction${className}__AstroComponent_(_props:typeofProps):any{<div></div>}`)
  });
});

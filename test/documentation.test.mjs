import test from 'node:test';
import assert from 'node:assert/strict';
import {headingAnchors} from '../src/markdown-links.mjs';
test('documentation anchor validation handles duplicate headings, punctuation and fenced examples',()=>{
 const markdown='# Getting started\n## Wi-Fi panels\n## Wi-Fi panels\n```md\n# Not a real heading\n```\n## Use [data](data.json) & `code`\n<a id="custom"></a>';
 assert.deepEqual([...headingAnchors(markdown)],['getting-started','wi-fi-panels','wi-fi-panels-1','use-data--code','custom']);
});

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';

import katex from 'katex';
import 'katex/dist/katex.min.css'; // Import the CSS

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', shell);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);



// Create a custom extension for marked to handle math
const katexExtension = {
	name: 'katex',
	level: 'inline' as const, // This handles both inline and block
	start(src: string) { return src.indexOf('$'); },
	tokenizer(src: string) {
		// Match $$...$$ for display math, or $...$ for inline math
		const blockMatch = /^\$\$([\s\S]+?)\$\$/.exec(src);
		if (blockMatch) {
			return {
				type: 'katex',
				raw: blockMatch[0],
				text: blockMatch[1],
				displayMode: true,
			};
		}
		const inlineMatch = /^\$([^$\n]+?)\$/.exec(src);
		if (inlineMatch) {
			return {
				type: 'katex',
				raw: inlineMatch[0],
				text: inlineMatch[1],
				displayMode: false,
			};
		}
	},
	renderer(token: any) {
		try {
			return katex.renderToString(token.text, {
				displayMode: token.displayMode,
				throwOnError: false, // Prevents crashes on bad LaTeX
				output: 'html',
			});
		} catch (e) {
			return `<span class="katex-error">${token.raw}</span>`;
		}
	},
};

// Register the extension with marked
marked.use({ extensions: [katexExtension], gfm: true, breaks: true });



export function highlightCode(code: string, language?: string): string {
	if (language && hljs.getLanguage(language)) {
		try {
			return hljs.highlight(code, { language }).value;
		} catch { /* fall through */ }
	}
	try {
		return hljs.highlightAuto(code).value;
	} catch {
		return code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
}

// Configure marked once, at module load.
// v12+ signature: renderer.code receives a single object.
const renderer = {
	code({ text, lang }: { text: string; lang?: string }) {
		const highlighted = highlightCode(text, lang || undefined);
		const cls = `hljs${lang ? ` language-${lang}` : ''}`;
		return `<pre><code class="${cls}">${highlighted}</code></pre>`;
	},
} as any;

marked.use({
	renderer,
	gfm: true,
	breaks: true,
	async: false,   // force sync — no Promises
});

export function renderWithHighlight(markdown: string, isStreaming = false): string {
  if (isStreaming) {
    // Hide an unterminated display-math block so KaTeX doesn't
    // show a red error for a formula that hasn't finished arriving.
    const lastOpen = markdown.lastIndexOf('$$');
    if (lastOpen !== -1) {
      const tail = markdown.slice(lastOpen + 2);
      if (!tail.includes('$$')) {
        markdown = markdown.slice(0, lastOpen);
      }
    }
  }

  const html = marked.parse(markdown) as string;
  return DOMPurify.sanitize(html, { ADD_ATTR: ['class', 'target', 'rel'] });
}
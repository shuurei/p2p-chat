import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import path from 'path'

const now = new Date();

// https://vite.dev/config/
export default defineConfig({
	base: '/p2p-chat',
	plugins: [
		react(),
		tailwindcss()
	],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src')
		}
	},
	define: {
		__BUILD_VERSION__: JSON.stringify(`v${String(now.getUTCFullYear()).slice(-2)}.${String(now.getUTCMonth() + 1).padStart(2, '0')}.${String(now.getUTCDate()).padStart(2, '0')}`),
		__BUILD_NUMBER__: JSON.stringify(`${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`),
		__GIT_COMMIT__: JSON.stringify(execSync(`git rev-parse --short HEAD`, { encoding: 'utf8', }).trim())
	}
});

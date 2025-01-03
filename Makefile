ZIP_CHROME_FILE="extension.chrome.zip"

clean:
	rm -rf ./node_modules ./pnpm-lock.yaml ./public/build $(ZIP_CHROME_FILE)

install:
	npm i -g pnpm
	pnpm i
	pnpm rebuild sass

dev:
	rm -rf ./public/build
	NODE_ENV=development \
		deno run --watch --allow-env --allow-read --allow-run deno-bundle.ts
	
lint:
	pnpm exec prettier . --write
	pnpm exec svelte-check

test:
	pnpm exec jest --config jest/jest.config.js

prod: lint test
	rm -rf ./public/build $(ZIP_CHROME_FILE)
	NODE_ENV=production \
		time deno run --allow-env --allow-read --allow-run deno-bundle.ts --production
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null

.PHONY: clean install dev lint prod test
.DEFAULT_GOAL := dev

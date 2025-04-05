.PHONY: clean install dev valid test prod
.DEFAULT_GOAL := dev
ZIP_CHROME_FILE="extension.chrome.zip"
BUNDLE = ./deno-bundle.ts

clean:
	rm -rf ./node_modules ./pnpm-lock.yaml ./public/build $(ZIP_CHROME_FILE)

install:
	deno install --allow-scripts
	npm i -g pnpm
	pnpm i
	pnpm rebuild sass

dev:
	rm -rf ./public/build
	NODE_ENV=development \
		deno run --watch --allow-env --allow-read --allow-run $(BUNDLE)

valid:
	deno fmt --unstable-component
	deno lint
	pnpm exec svelte-check --no-tsconfig # only for *.svelte files

test: valid
	deno test --no-check --trace-leaks --reporter=dot

prod: test
	rm -rf ./public/build $(ZIP_CHROME_FILE)
	NODE_ENV=production \
		deno run --allow-env --allow-read --allow-run $(BUNDLE)
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null
	ls -l public/build/; ls -l extension.chrome.zip

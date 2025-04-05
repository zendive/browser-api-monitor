.PHONY: clean install dev valid test prod
.DEFAULT_GOAL := dev
DENO_DEV = NODE_ENV=development deno run --watch
DENO_PROD = NODE_ENV=production deno run
DENO_OPTIONS = --allow-env --allow-read --allow-run
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
	$(DENO_DEV) $(DENO_OPTIONS) $(BUNDLE)

valid:
	deno fmt --unstable-component
	deno lint
	pnpm exec svelte-check --no-tsconfig # only for *.svelte files

test: valid
	deno test --no-check --trace-leaks --reporter=dot

prod: test
	rm -rf ./public/build $(ZIP_CHROME_FILE)
	$(DENO_PROD) $(DENO_OPTIONS) $(BUNDLE)
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null
	ls -l public/build/; ls -l extension.chrome.zip

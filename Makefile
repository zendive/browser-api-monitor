.PHONY: clean install dev valid test prod
.DEFAULT_GOAL := dev
DENO_DEV = NODE_ENV=development deno run --watch
DENO_PROD = NODE_ENV=production deno run
DENO_OPTIONS = --allow-env --allow-read --allow-run
CHROME_ZIP="extension.chrome.zip"
OUTPUT_DIR = ./public/
BUILD_DIR = ./public/build/
BUILD_SCRIPT = ./build.ts

clean:
	rm -rf ./node_modules $(BUILD_DIR) $(CHROME_ZIP)

install:
	deno install --allow-scripts
	npm i -g pnpm # for svelte-check

dev:
	rm -rf $(BUILD_DIR)
	$(DENO_DEV) $(DENO_OPTIONS) $(BUILD_SCRIPT)

valid:
	deno fmt --unstable-component
	deno lint
	pnpm exec svelte-check --no-tsconfig # only for *.svelte files

test: valid
	deno test --no-check --trace-leaks --reporter=dot

prod: test
	rm -rf $(BUILD_DIR) $(CHROME_ZIP)
	$(DENO_PROD) $(DENO_OPTIONS) $(BUILD_SCRIPT)
	zip -r $(CHROME_ZIP) $(OUTPUT_DIR) ./manifest.json > /dev/null
	tree -Dis $(BUILD_DIR) *.zip

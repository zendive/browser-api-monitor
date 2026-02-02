.DEFAULT_GOAL := dev

# Ensure environment dependencies exist
REQUIRED_BINS := deno jq zip tree python3
$(foreach bin,$(REQUIRED_BINS),\
    $(if $(shell command -v $(bin) 2> /dev/null),,$(error Missing dependency: `$(bin)`)))

DENO_DEV := NODE_ENV=development deno run --watch
DENO_PROD := NODE_ENV=production deno run
DENO_OPTIONS := --allow-env --allow-read --allow-run
VERSION != jq -j '.version' ./manifest.json
CHROME_ZIP := "extension.chrome-$(VERSION).zip"
OUTPUT_DIR := ./public/
BUILD_DIR := ./public/build/
BUILD_SCRIPT := ./build.ts

.PHONY: clean
clean:
	rm -rf ./node_modules $(BUILD_DIR) $(CHROME_ZIP)

.PHONY: install
install:
	deno install --allow-scripts=npm:svelte-preprocess,npm:@parcel/watcher,npm:esbuild

.PHOONY: update
update:
	deno update --latest

.PHONY: dev
dev:
	rm -rf $(BUILD_DIR)
	$(DENO_DEV) $(DENO_OPTIONS) $(BUILD_SCRIPT)

.PHONY: valid
valid:
	deno fmt --unstable-component
	deno lint
	deno $(DENO_OPTIONS) npm:svelte-check --no-tsconfig # only for *.svelte files

.PHONY: test
test: valid
	deno test --parallel --no-check --trace-leaks --reporter=dot --allow-env=WS_NO_BUFFER_UTIL

.PHONY: test-dev
test-dev:
	deno test --watch --parallel --no-check --trace-leaks --allow-env=WS_NO_BUFFER_UTIL

.PHONY: prod
prod: test
	rm -rf $(BUILD_DIR) $(CHROME_ZIP)
	$(DENO_PROD) $(DENO_OPTIONS) $(BUILD_SCRIPT)

	zip -r $(CHROME_ZIP) $(OUTPUT_DIR) ./manifest.json > /dev/null
	zip --delete $(CHROME_ZIP) "$(OUTPUT_DIR)mirror.html" "$(BUILD_DIR)mirror/*" > /dev/null

	tree -Dis $(BUILD_DIR) *.zip | grep -E "api|zip"

.PHONY: mirror-dev
mirror-dev:
	@echo "🎗 reminder to stop \"make dev\""
	rm -rf $(BUILD_DIR)
	$(DENO_DEV) $(DENO_OPTIONS) $(BUILD_SCRIPT) --mirror

.PHONY: mirror-serve
mirror-serve:
	@echo "🎗 reminder to switch extension off"
	@echo "served at: http://localhost:5555/mirror.html"
	python3 -m http.server 5555 -d ./public/

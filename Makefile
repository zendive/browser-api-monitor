.DEFAULT_GOAL := dev

# Ensure environment dependencies exist
REQUIRED_BINS := deno jq zip tree grep wc
$(foreach bin,$(REQUIRED_BINS),$(if $(shell command -v $(bin) 2> /dev/null),,$(error ❓ Missing dependency: `$(bin)`)))

BUILD_DEV := BUILD_MODE=development deno run --watch --allow-env --allow-read --allow-run
BUILD_PROD := BUILD_MODE=production deno run --allow-env --allow-read --allow-run
VERSION != jq -j '.version' ./manifest.json
CHROME_ZIP := "extension.chrome-$(VERSION).zip"
OUTPUT_DIR := ./public/
BUILD_DIR := ./public/build/
BUILD_SCRIPT := ./build.ts
DEBUGGERs_IN_PROD := 29

.PHONY: clean
clean:
	rm -rf ./node_modules $(BUILD_DIR) $(CHROME_ZIP)

.PHONY: install
install:
	deno install
	deno audit

.PHONY: update
update:
	deno update --latest

.PHONY: dev
dev:
	rm -rf $(BUILD_DIR)
	$(BUILD_DEV) $(BUILD_SCRIPT)

.PHONY: valid
valid:
	deno fmt --unstable-component
	deno lint
	deno run --allow-read --allow-env npm:svelte-check

.PHONY: test
test: valid
	deno test --allow-env=WS_NO_BUFFER_UTIL --parallel --no-check --trace-leaks --reporter=dot

.PHONY: test-dev
test-dev:
	deno test --allow-env=WS_NO_BUFFER_UTIL --watch --parallel --no-check --trace-leaks

.PHONY: test-post-build
test-post-build:
	@echo "Ensure that debugger statement is preserved in production build mode"
	@COUNT=$$(grep --only-matching --fixed-strings "debugger;" $(BUILD_DIR)/*cs-main.js | wc --lines); \
	if [ "$$COUNT" -eq $(DEBUGGERs_IN_PROD) ]; then \
		echo "$(DEBUGGERs_IN_PROD) is OK"; \
	else \
		echo "❓ Main content script has $$COUNT and not $(DEBUGGERs_IN_PROD) 'debugger;' statements"; \
		exit 1; \
	fi

.PHONY: prod
prod: test
	rm -rf $(BUILD_DIR) $(CHROME_ZIP)
	$(BUILD_PROD) $(BUILD_SCRIPT)
	@$(MAKE) test-post-build

	zip -r $(CHROME_ZIP) $(OUTPUT_DIR) ./manifest.json > /dev/null
	zip --delete $(CHROME_ZIP) "$(OUTPUT_DIR)mirror.html" "$(BUILD_DIR)mirror/*" > /dev/null

	tree -Dis $(BUILD_DIR) *.zip | grep -E "api|zip"

	deno audit

.PHONY: all
all: prod

.PHONY: mirror-dev
mirror-dev:
	@echo "🎗 reminder to stop \"make dev\""
	rm -rf $(BUILD_DIR)
	$(BUILD_DEV) $(BUILD_SCRIPT) -- --x-mirror

.PHONY: mirror-serve
mirror-serve:
	REQUIRED_BINS := python3
	$(foreach bin,$(REQUIRED_BINS),$(if $(shell command -v $(bin) 2> /dev/null),,$(error ❓ Missing dependency: `$(bin)` to run static http.server)))

	@echo "🎗 reminder to switch extension off"
	@echo "served at: http://localhost:5555/mirror.html"
	python3 -m http.server 5555 -d ./public/

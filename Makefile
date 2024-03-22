ZIP_CHROME_FILE="extension.chrome.zip"

clean:
	rm -rf ./node_modules ./public/build $(ZIP_CHROME_FILE)

install:
	npm i -g pnpm
	pnpm i

dev:
	rm -rf ./public/build
	NODE_OPTIONS="--loader=ts-node/esm" \
		npx webpack --progress --watch --mode=development

lint:
	npx prettier . --write
	npx svelte-check

prod:
	rm -rf ./public/build
	make lint
	NODE_OPTIONS="--loader=ts-node/esm --no-warnings=ExperimentalWarning" \
		NODE_ENV="production" \
		time npx webpack --mode=production
	rm -rf $(ZIP_CHROME_FILE)
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null

.PHONY: clean install dev lint prod
.DEFAULT_GOAL := dev

ZIP_CHROME_FILE="extension.chrome.zip"

clean:
	rm -rf ./node_modules ./public/build

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
	make lint
	rm -rf ./public/build
	NODE_OPTIONS="--loader=ts-node/esm --no-warnings=ExperimentalWarning" \
		NODE_ENV="production" \
		time npx webpack --mode=production

zip_chrome:
	rm -rf $(ZIP_CHROME_FILE)
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null

all:
	make prod
	make zip_chrome

.PHONY: clean install dev lint prod zip_chrome all
.DEFAULT_GOAL := dev

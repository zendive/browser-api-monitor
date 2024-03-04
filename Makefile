ZIP_CHROME_FILE="extension.chrome.zip"

clean:
	rm -rf ./node_modules ./public/build

install:
	npm i -g pnpm
	pnpm i

dev:
	npx rollup -c -w

prod:
	npx svelte-check
	time npx rollup -c

zip_chrome:
	rm -rf $(ZIP_CHROME_FILE)
	zip -r $(ZIP_CHROME_FILE) ./public ./manifest.json > /dev/null

all:
	make prod
	make zip_chrome

.PHONY: clean install dev prod zip_chrome all
.DEFAULT_GOAL := dev

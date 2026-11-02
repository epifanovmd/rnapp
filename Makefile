.PHONY: check lint typecheck test

check:
	yarn run check

lint:
	yarn lint

typecheck:
	yarn typecheck

test:
	yarn test --runInBand

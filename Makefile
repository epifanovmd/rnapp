.PHONY: check lint typecheck test

check: lint typecheck test

lint:
	cd template && yarn lint

typecheck:
	cd template && yarn typecheck

test:
	cd template && yarn test --runInBand

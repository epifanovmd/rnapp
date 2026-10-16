.PHONY: check lint typecheck test

check:
	cd template && yarn run check

lint:
	cd template && yarn lint

typecheck:
	cd template && yarn typecheck

test:
	cd template && yarn test --runInBand

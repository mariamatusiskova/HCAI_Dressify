# src/test/

Vitest setup and tests.

## Files
- `setup.ts`: Test bootstrap (`jest-dom`, `matchMedia` mock), loaded via `vitest.config.ts` `setupFiles`.
- `example.test.ts`: minimal sample test that verifies the Vitest environment is wired correctly.

## Notes

- Tests are run with `npm test`.
- The current test suite is lightweight and mostly validates tooling/bootstrap rather than full feature behavior.

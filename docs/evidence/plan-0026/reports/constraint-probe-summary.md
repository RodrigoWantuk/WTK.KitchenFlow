# Declared-yield CHECK probe

Against migration `20260804013603_AddPreparedComponentTransactions`:

- ACCEPTED: all-null
- ACCEPTED: value-without-unit
- REJECTED: unit-without-value
- REJECTED: measured-and-availability
- REJECTED: zero
- REJECTED: unknown-unit
- REJECTED: unknown-availability

Supports F-0026-02.

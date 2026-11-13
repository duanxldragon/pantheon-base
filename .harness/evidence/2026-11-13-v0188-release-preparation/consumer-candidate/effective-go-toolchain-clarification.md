# Effective Go toolchain clarification

The earlier build-environment and final-build receipt record Go 1.26.5 as the bootstrap executable version captured outside the backend module. The backend go.mod requires Go 1.26.10. Readonly commands executed in the exact assembled candidate backend with the same native Git/Go/MinGW PATH and CGO_ENABLED=1 returned:

- D:/Go/bin/go.exe version → go version go1.26.10 windows/amd64 (exit 0)
- D:/Go/bin/go.exe env GOVERSION GOTOOLCHAIN → go1.26.10 / auto (exit 0)

Thus the effective compiler selected automatically for this module is Go 1.26.10; Go 1.26.5 denotes the bootstrap binary only. See effective-go-toolchain-receipt.json, effective-go-version.log and effective-go-env.log for exact paths, timestamps and log SHA256 values.

No new build was run and no sealed candidate bytes were edited. The original final-build-receipt.json remains byte-identical with SHA256 a677d1fc7083c372c77e2626b644d3b6a6813cf2d810cc1c77bd901bdedf83f7.

The original CRLF effective-Go receipt is retained as effective-go-toolchain-receipt.json.gz, with its original SHA256 bound to decompression. The plain JSON is an LF-normalized convenience view with unchanged values; the parent raw-json-artifacts.json records both identities. The original clarification text remains retained in effective-go-toolchain-clarification.md.gz.

# Summary

Two tracked Chinese Harness documents contained literal Unicode replacement
characters (`U+FFFD`), which are valid UTF-8 bytes but evidence of prior decode
corruption. The documents were restored and the strict encoding gate now
rejects replacement characters in addition to malformed UTF-8 sequences.

Local checks passed. PR #227 merged as eddde673 and the subsequent hosted
SonarCloud analysis completed successfully without the encoding warning.

# Summary

Two tracked Chinese Harness documents contained literal Unicode replacement
characters (`U+FFFD`), which are valid UTF-8 bytes but evidence of prior decode
corruption. The documents were restored and the strict encoding gate now
rejects replacement characters in addition to malformed UTF-8 sequences.

Local checks are green. Hosted SonarCloud verification remains pending until
the pull request is merged and automatic analysis scans the new `main` revision.

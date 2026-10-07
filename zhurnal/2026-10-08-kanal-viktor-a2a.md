# Viktor A2A endpoint candidate, 08.10.2026

Problem map: the Alpha generic client now signs EdDSA per-owner JWT (claimguard candidate), while guest `/v1/agent/run` requires a static scoped bearer, and no A2A Task adapter exists. Client auth, owner-bound guest verifier, idempotent agent runtime, HTTPS ingress, catalog verification and actual owner receipt are distinct gates. The most dangerous unclosed path is a guest accepting another owner or executing duplicate requests; fail closed before exposing network ingress.

Root change: add guest-only optional JWT verifier and A2A Task adapter backed by the existing durable guest reservation and `read_learnings` tool boundary. Bind JWT subject to the existing grant's principal, bind audience to the card URL, store request text SHA-256 at reservation and refuse contradictory replays. No legacy route changes; the A2A adapter remains disabled by default.

Verification: targeted `bun test` (see handoff for exact output); external ingress, key install, and owner-channel receipt **not verified**. Full typecheck in this worktree is RED due to 40+ pre-existing tsconfig/dependency issues in the symlinked dependency tree; see `/tmp/kanal-viktor-a2a-tsc.log`, not claimed green. Rollback: disable `VIKTOR_A2A_*` variables; remove this patch only after other users stop referencing this candidate.

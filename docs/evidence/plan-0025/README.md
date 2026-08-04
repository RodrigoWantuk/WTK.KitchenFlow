# PLAN-0025 independent retest evidence

This directory records an independent retest of the immutable PLAN-0020 remediation candidate `06bd95baacaabaa099170de1ba41187a8e885dea`.

Product verification runs only in the detached worktree `../WTK.Cocinaris-plan-0025-sut`. The evidence branch starts from the PR #35 packaging head `8b3022b733120fd8c3e8be1f9e95ca5fa888b67b`; it must never be confused with the SUT.

The historical PLAN-0024 Fail evidence is immutable on `agent/plan-0024-validate-plan-0020-profile` and is referenced, not copied or rewritten.

The reports directory contains privacy-safe command output. It must not include profile values, tokens, cookies, CSRF values, authorization headers, or sensitive request bodies.

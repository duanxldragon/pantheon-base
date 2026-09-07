# Review Artifact

## Review Scope

Reviewed the Core Smoke follow-up against the current IAM frontend and backend contracts.

## Findings

- RESOLVED: menu smoke used obsolete `menuName`, `menuType`, and `visible` fields; payloads now match `MenuCreateReq`.
- RESOLVED: user smoke used obsolete `realName`; create and edit flows now use `nickname` and include `roleIds`.
- RESOLVED: menu cleanup inspected a nonexistent `menuName` response property; it now matches `titleKey`.

## Verdict

Local static gates are clear. Runtime approval remains intentionally deferred to hosted Core Smoke and required GitHub checks. No `solo-override` bypass is permitted.

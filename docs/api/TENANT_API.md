# Tenant Management API Documentation

Version: 1.1 (2026-10-22: paths aligned with the mounted surface)  
Base URL: `/api/v1`

## Overview

The Tenant Management API provides endpoints for managing multi-tenant resources in Pantheon Base.

**Mounted surface.** The console endpoints live under `/api/v1/system/tenant*` and are mounted by
`backend/modules/system/system_modules.go` on a group that carries
`TokenAuthMiddleware` + `PlatformScopeTenantContextMiddleware` + `CasbinMiddleware` +
`PlatformCapabilityMiddleware`. They are platform-only: a tenant administrator (or any subject
without a platform-level grant) is rejected with `403 tenant.platformOnly` even when a request
reaches the handler, and Casbin still requires `system:tenant:*` on top.

The earlier `/api/v1/tenants*` group in `tenant_routes.go` is **not mounted**; do not integrate
against it.

**Envelope.** Every response uses the platform envelope `{ "code": 200, "data": ..., "message": "success" }`.
The payloads below describe `data`; errors carry a non-200 `code` and an i18n `message` key.

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Tenant

**POST** `/system/tenant`

Creates a new tenant.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Request Body**:
```json
{
  "code": "acme-corp",
  "name": "ACME Corporation",
  "plan": "enterprise",
  "metadata": "{\"industry\":\"technology\"}"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "code": "acme-corp",
  "name": "ACME Corporation",
  "status": "active",
  "plan": "enterprise",
  "metadata": "{\"industry\":\"technology\"}",
  "created_at": "2026-09-29T10:00:00Z",
  "updated_at": "2026-09-29T10:00:00Z"
}
```

**Errors**:
- `400 Bad Request`: Invalid input
- Envelope `code` `400` + `tenant.code_taken`: the tenant code is already held by a live tenant
- Envelope `code` `400` + `tenant.code_reserved`: the code is held by a soft-deleted tenant

---

### 2. List Tenants

**GET** `/system/tenant/list`

Lists all tenants with pagination and filtering.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Query Parameters**:
- `status` (optional): Filter by status (`active`, `suspended`, `deleted`)
- `plan` (optional): Filter by plan (`free`, `basic`, `professional`, `enterprise`)
- `page` (optional): Page number (default: 1)
- `size` (optional): Page size (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 1,
      "code": "acme-corp",
      "name": "ACME Corporation",
      "status": "active",
      "plan": "enterprise",
      "created_at": "2026-09-29T10:00:00Z",
      "updated_at": "2026-09-29T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "size": 20
}
```

---

### 3. Get Tenant

**GET** `/system/tenant/:id`

Retrieves a tenant by ID.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Response** (200 OK):
```json
{
  "id": 1,
  "code": "acme-corp",
  "name": "ACME Corporation",
  "status": "active",
  "plan": "enterprise",
  "created_at": "2026-09-29T10:00:00Z",
  "updated_at": "2026-09-29T10:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Tenant not found

---

### 4. Update Tenant

**PUT** `/system/tenant/:id`

Updates tenant properties.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Request Body**:
```json
{
  "name": "ACME Corporation Ltd",
  "status": "suspended",
  "plan": "professional"
}
```

All fields are optional. Only provided fields will be updated.

**Response** (200 OK):
```json
{
  "message": "tenant updated successfully"
}
```

**Errors**:
- `404 Not Found`: Tenant not found

---

### 5. Delete Tenant

**DELETE** `/system/tenant/:id`

Marks a tenant as deleted (soft delete).

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Response** (200 OK):
```json
{
  "message": "tenant deleted successfully"
}
```

**Errors**:
- `400 Bad Request`: Tenant has active members
- `404 Not Found`: Tenant not found

**Note**: A tenant can only be deleted if it has no active members. Remove all members first.

---

### 6. Add Tenant Member

**POST** `/system/tenant/:id/members`

Adds a user to a tenant.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Request Body**:
```json
{
  "user_id": 100,
  "role": "admin"
}
```

**Roles**:
- `owner`: Full control over tenant
- `admin`: Administrative access
- `member`: Standard member access

**Response** (200 OK):
```json
{
  "message": "member added successfully"
}
```

**Errors**:
- `404 Not Found`: Tenant or user not found
- Envelope `code` `400` + `tenant.member_exists`: the user is already a member (re-adding is idempotent for non-owner rows)

---

### 7. List Tenant Members

**GET** `/system/tenant/:id/members`

Lists one bounded page of active tenant members, ordered by creation time and ID. The response envelope is stable for all consumers; the `/members/page` path below remains as a compatibility alias.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Query parameters**: `page` (default 1, minimum 1), `pageSize` (default 20, maximum 100). Invalid or non-positive values use the defaults; larger page sizes are capped at 100.

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 1,
      "tenant_id": 1,
      "user_id": 100,
      "role": "owner",
      "status": "active",
      "created_at": "2026-09-29T10:00:00Z",
      "updated_at": "2026-09-29T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**GET** `/system/tenant/:id/members/page`

Compatibility alias for the same bounded pagination contract and response envelope.
### 8. Remove Tenant Member

**DELETE** `/system/tenant/:id/members/:userId`

Removes a user from a tenant.

**Authorization**: Platform capability required (`PlatformCapabilityMiddleware` + `system:tenant:*`)

**Response** (200 OK):
```json
{
  "message": "member removed successfully"
}
```

**Errors**:
- `404 Not Found`: Membership not found

---

### 9. Get My Tenants

**GET** `/auth/tenants/switchable`

Returns the tenants the current authenticated user may switch into (active memberships). This is
the mounted equivalent of the legacy `GET /tenants/my`; the legacy group is not registered.

**Authorization**: Requires authentication (any authenticated user)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "code": "acme-corp",
    "name": "ACME Corporation",
    "status": "active",
    "plan": "enterprise",
    "created_at": "2026-09-29T10:00:00Z",
    "updated_at": "2026-09-29T10:00:00Z"
  }
]
```

---

## Usage Examples

### Create a new tenant

```bash
curl -X POST http://localhost:8080/api/v1/system/tenant \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "acme-corp",
    "name": "ACME Corporation",
    "plan": "enterprise"
  }'
```

### Add admin user to tenant

```bash
curl -X POST http://localhost:8080/api/v1/system/tenant/1/members \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 100,
    "role": "owner"
  }'
```

### List my tenants

```bash
curl -X GET http://localhost:8080/api/v1/auth/tenants/switchable \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

Errors use the same envelope, with a non-200 `code` and an i18n `message` key:

```json
{
  "code": 403,
  "data": null,
  "message": "tenant.platformOnly"
}
```

Codes seen on this surface:

| HTTP | `code` | `message` | When |
| --- | --- | --- | --- |
| 200 | 200 | `success` | OK |
| 200 | 400 | `param.invalid` | Binding/validation failure (also used for state conflicts; the envelope has no 409) |
| 200 | 400 | `tenant.member.last_owner` | Removing the last active owner (contract §2.2) |
| 200 | 400 | `tenant.status.terminal` | Trying to move an archived tenant (contract §2.1) |
| 200 | 403 | `tenant.platformOnly` | Non-platform subject on the tenant console |
| 200 | 403 | `tenant.forbidden` | Foreign tenant id in the body / untrusted `X-Tenant-Id` |
| 200 | 404 | `tenant.not_found` | Unknown tenant or membership |

> The transport status stays `200` for business failures; always branch on the envelope `code`,
> not on the HTTP status. This is the platform-wide convention, not tenant-specific.
- `500 Internal Server Error`: Server error

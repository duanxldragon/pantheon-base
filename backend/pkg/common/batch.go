package common

// BatchDeleteReq represents a request to delete multiple items by IDs.
type BatchDeleteReq struct {
	IDs []uint64 `json:"ids" binding:"required"`
}

// BatchDeleteFailure records a failed deletion with the reason.
type BatchDeleteFailure struct {
	ID     uint64 `json:"id"`
	Reason string `json:"reason"`
}

// BatchDeleteResp contains the result of a batch delete operation.
type BatchDeleteResp struct {
	DeletedCount int                  `json:"deletedCount"`
	FailedCount  int                  `json:"failedCount"`
	Failures     []BatchDeleteFailure `json:"failures"`
}

// BatchDelete performs batch deletion of items by IDs.
// Calls deleteOne for each ID and collects results.
//
// Parameters:
//   - ids: slice of IDs to delete
//   - deleteOne: function to delete a single item by ID
//
// Returns a BatchDeleteResp with counts and details of any failures.
func BatchDelete(ids []uint64, deleteOne func(uint64) error) BatchDeleteResp {
	normalized := NormalizeUint64IDs(ids)
	resp := BatchDeleteResp{
		Failures: []BatchDeleteFailure{},
	}
	for _, id := range normalized {
		if err := deleteOne(id); err != nil {
			resp.Failures = append(resp.Failures, BatchDeleteFailure{ID: id, Reason: ResolveErrorMessageKey(err, "request.failed")})
			continue
		}
		resp.DeletedCount++
	}
	resp.FailedCount = len(resp.Failures)
	return resp
}

// NormalizeUint64IDs removes duplicates and zeros from a slice of uint64 IDs.
// Returns a new slice with unique, non-zero IDs in original order.
func NormalizeUint64IDs(ids []uint64) []uint64 {
	seen := make(map[uint64]struct{}, len(ids))
	normalized := make([]uint64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		normalized = append(normalized, id)
	}
	return normalized
}

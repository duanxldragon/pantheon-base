package common

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

const (
	CodeSuccess      = 200
	CodeError        = 500
	CodeParamInvalid = 400
	CodeUnauthorized = 401
	CodeForbidden    = 403
	CodeNotFound     = 404
)

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Data:    data,
		Message: "success",
	})
}

func Fail(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Data:    nil,
		Message: message,
	})
}

func FailWithCode(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Data:    nil,
		Message: message,
	})
}

func GetUserID(c *gin.Context) uint64 {
	for _, key := range []string{"userID", "userId"} {
		val, ok := c.Get(key)
		if !ok {
			continue
		}
		userID, ok := val.(uint64)
		if ok {
			return userID
		}
	}
	return 0
}

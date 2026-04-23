package common

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`    // 业务错误码 (200: 成功, 其他: 失败)
	Data    interface{} `json:"data"`    // 数据
	Message string      `json:"message"` // 消息 (通常用于 i18n key)
}

// Success 成功返回
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    200,
		Data:    data,
		Message: "success",
	})
}

// Fail 失败返回
func Fail(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Data:    nil,
		Message: message,
	})
}

// 预定义一些底座错误码
const (
	CodeError        = 500
	CodeUnauthorized = 401
	CodeForbidden    = 403
	CodeParamInvalid = 400
)

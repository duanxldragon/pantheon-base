package main

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := "root:DHCCroot@2025@tcp(127.0.0.1:3306)/pantheon?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Failed to connect database:", err)
		return
	}

	fmt.Println("Cleaning up CMDB menus...")
	err = db.Table("system_menu").Where("module = ?", "cmdb").Delete(nil).Error
	if err != nil {
		fmt.Println("Cleanup failed:", err)
	} else {
		fmt.Println("Successfully cleaned up CMDB menus.")
	}
}

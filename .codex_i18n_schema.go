package main
import (
  "database/sql"
  "fmt"
  _ "modernc.org/sqlite"
)
func main() {
  db, err := sql.Open("sqlite", "pantheon.db")
  if err != nil { panic(err) }
  defer db.Close()
  rows, err := db.Query("PRAGMA table_info(system_i18n)")
  if err != nil { panic(err) }
  defer rows.Close()
  for rows.Next() {
    var cid int
    var name, ctype string
    var notnull, pk int
    var dflt any
    if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil { panic(err) }
    fmt.Printf("cid=%d name=%s type=%s notnull=%d default=%v pk=%d\n", cid, name, ctype, notnull, dflt, pk)
  }
  fmt.Println("-- indexes --")
  idxRows, err := db.Query("PRAGMA index_list(system_i18n)")
  if err != nil { panic(err) }
  defer idxRows.Close()
  for idxRows.Next() {
    var seq int
    var name string
    var unique int
    var origin, partial string
    if err := idxRows.Scan(&seq, &name, &unique, &origin, &partial); err != nil { panic(err) }
    fmt.Printf("seq=%d name=%s unique=%d origin=%s partial=%s\n", seq, name, unique, origin, partial)
  }
}

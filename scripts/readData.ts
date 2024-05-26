import { Cell, Dictionary } from "@ton/core";

let c = Cell.fromBase64("te6cckECCgEAAcEAAQMAwAECASACBAFDv/CC62Y7V6ABkvSmrEZyiN8t/t252hvuKPZSHIvr0h8ewAMAZgBodHRwczovL21lZGlhLnRlbm9yLmNvbS80Y1RKNHNEZEluMEFBQUFlL2Fib2JhLnBuZwIBIAUHAUK/gqNTf/Dbzn7sNdae3DoYnubxfYLzU6VT+aqWywvjzokGAD4AMTAwMCBib2JhIGxvY2tlZCBvbiBKVmF1bHQuYXBwAva/iQRvejetDqfO5zNVmE+lQomC+LN8j3vOyR96xxp80QRBdmFpbGFibGUgdG8gd2l0aGRyYXc6IDEwMCBib2JhCgpGaXJzdCB1bmxvY2sgdGltZXN0YW1wOiAxNzE2NzQwOTUyCkZpcnN0IHVubG9jayBzaXplOiAxMCUICQBsClZlc3RpbmcgY3ljbGVzIG51bWJlcjogCjkKVmVzdGluZyBjeWNsZSBsZW5ndGg6IDBkYXlzALRBdmFpbGFibGUgdG8gd2l0aGRyYXc6IDEwMCBib2JhCgpGaXJzdCB1bmxvY2sgdGltZXN0YW1wOiAxNzE2NzQwOTUyCkZpcnN0IHVubG9jayBzaXplOiAxMCWsZIh/").beginParse()
console.log(c.loadUint(8))
let d = c.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
// console.log(d)
for (let s of d.values()) {
let v = s.asSlice()
console.log(v.loadUint(8))
console.log(v.loadStringTail())
}

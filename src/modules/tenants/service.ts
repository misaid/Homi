// service layer for this module
// validate inputs, enforce business rules, call repo functions

export function assertSameOrg(a: string, b: string) {
  if (a !== b) throw new Error("org mismatch");
}

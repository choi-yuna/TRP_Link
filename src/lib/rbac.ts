export function canAccess(
  userRoles: readonly string[],
  required: readonly string[] = []
) {
  if (required.length === 0) return true;
  return required.some((r) => userRoles.includes(r));
}

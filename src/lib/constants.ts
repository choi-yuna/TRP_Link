export const NAV_ITEMS = [
    { href: "/dashboard", label: "대시보드", requiredRoles: [] },
    { href: "/users",     label: "사용자",   requiredRoles: ["ADMIN"] },
  ] as const;
  
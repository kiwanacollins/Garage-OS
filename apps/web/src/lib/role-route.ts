export function getRoleRoute(role: string | null | undefined) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'front_desk':
      return '/front-desk';
    case 'mechanic':
      return '/mechanic';
    case 'customer':
      return '/customer';
    default:
      return '/login';
  }
}

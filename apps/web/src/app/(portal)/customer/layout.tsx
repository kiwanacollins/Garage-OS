import { RoleGuard } from '@/components/RoleGuard';

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['customer']}>{children}</RoleGuard>;
}

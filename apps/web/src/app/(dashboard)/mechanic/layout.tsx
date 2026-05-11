import { RoleGuard } from '@/components/RoleGuard';

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['mechanic']}>{children}</RoleGuard>;
}

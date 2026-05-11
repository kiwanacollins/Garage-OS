import { RoleGuard } from '@/components/RoleGuard';

export default function FrontDeskLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['front_desk']}>{children}</RoleGuard>;
}

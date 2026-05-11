import { RoleGuard } from '@/components/RoleGuard';
import { MechanicProvider } from '@/lib/mechanic-store';

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['mechanic']}>
      <MechanicProvider>{children}</MechanicProvider>
    </RoleGuard>
  );
}

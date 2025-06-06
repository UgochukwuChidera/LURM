
import { UserManagementClientPage } from '@/components/admin/user-management-client-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management - Admin',
  description: 'Manage user accounts, including password resets.',
};

export default function UserManagementPage() {
  return <UserManagementClientPage />;
}

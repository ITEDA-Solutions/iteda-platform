'use client'

import { PermissionGuard } from '@/components/PermissionGuard'
import StaffManagement from '@/components/StaffManagement'

export default function StaffPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin', 'admin']} showError={true}>
      <StaffManagement />
    </PermissionGuard>
  )
}

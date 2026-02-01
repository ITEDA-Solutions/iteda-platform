'use client'

import { DryerRegistrationForm } from '@/components/DryerRegistrationForm'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function RegisterDryerPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin']} showError={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Register New Dryer</h1>
          <p className="text-muted-foreground">
            Add a new dryer to the system
          </p>
        </div>

        <DryerRegistrationForm />
      </div>
    </PermissionGuard>
  )
}

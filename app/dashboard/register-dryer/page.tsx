'use client'

import { DryerRegistrationForm } from '@/components/DryerRegistrationForm'
import { PermissionGuard } from '@/components/PermissionGuard'
import { Card, CardContent } from '@/components/ui/card'

export default function RegisterDryerPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin', 'admin']} showError={true}>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Register New Dryer</h1>
          <p className="text-muted-foreground">
            Add a new solar dryer unit to the monitoring system
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <DryerRegistrationForm />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}

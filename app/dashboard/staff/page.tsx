'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function StaffPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin']} showError={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff members and their assignments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              View and manage staff assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Staff management interface is under construction.
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}

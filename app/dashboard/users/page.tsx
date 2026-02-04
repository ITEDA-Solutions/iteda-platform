'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function UsersPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin']} showError={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and roles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              Create, edit, and manage user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              User management interface is under construction.
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}

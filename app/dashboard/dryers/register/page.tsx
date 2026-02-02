'use client'

import { DryerRegistrationForm } from '@/components/DryerRegistrationForm'
import { PermissionGuard } from '@/components/PermissionGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterDryerPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin']} showError={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Register New Dryer</h1>
            <p className="text-muted-foreground">
              Add a new solar dryer to the system
            </p>
          </div>
          <Link href="/dashboard/dryers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dryers
            </Button>
          </Link>
        </div>

        <DryerRegistrationForm />
      </div>
    </PermissionGuard>
  )
}

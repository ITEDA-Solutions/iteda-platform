'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DryersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dryers</h1>
        <p className="text-muted-foreground">
          View and manage all dryers in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dryer List</CardTitle>
          <CardDescription>
            All dryers based on your role permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dryer management interface is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

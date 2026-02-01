'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PresetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Presets</h1>
        <p className="text-muted-foreground">
          Manage dryer operation presets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dryer Presets</CardTitle>
          <CardDescription>
            Configure and manage operation presets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Presets management interface is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

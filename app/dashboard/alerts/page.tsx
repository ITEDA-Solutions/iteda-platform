'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage system alerts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            View and acknowledge alerts from your dryers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No alerts at this time. This page is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

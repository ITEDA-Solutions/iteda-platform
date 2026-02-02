'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, MessageSquare, UserPlus, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'

interface AlertActionsProps {
  alertId: string
  dryerId: string
  status: string
  onActionComplete?: () => void
}

export function AlertActions({ alertId, dryerId, status, onActionComplete }: AlertActionsProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [comment, setComment] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const { toast } = useToast()
  const { user } = usePermissions()

  const handleAcknowledge = async () => {
    setIsAcknowledging(true)
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          comment: comment || undefined 
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: 'Alert Acknowledged',
        description: 'The alert has been acknowledged successfully.',
      })

      setComment('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to acknowledge alert',
        variant: 'destructive',
      })
    } finally {
      setIsAcknowledging(false)
    }
  }

  const handleResolve = async () => {
    setIsResolving(true)
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          comment: comment || undefined 
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: 'Alert Resolved',
        description: 'The alert has been marked as resolved.',
      })

      setComment('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve alert',
        variant: 'destructive',
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          comment: comment || 'Dismissed as false positive' 
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: 'Alert Dismissed',
        description: 'The alert has been dismissed.',
      })

      setComment('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to dismiss alert',
        variant: 'destructive',
      })
    } finally {
      setIsDismissing(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) {
      toast({
        title: 'Error',
        description: 'Please select a technician to assign',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          technicianId: assignTo,
          assignedBy: user?.id 
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: 'Alert Assigned',
        description: 'The alert has been assigned to a technician.',
      })

      setAssignTo('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign alert',
        variant: 'destructive',
      })
    }
  }

  if (status === 'resolved' || status === 'dismissed') {
    return (
      <Badge variant="outline" className="text-green-600">
        {status === 'resolved' ? 'Resolved' : 'Dismissed'}
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'active' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Acknowledge Alert</DialogTitle>
              <DialogDescription>
                Mark this alert as acknowledged. You can add a comment below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
              >
                {isAcknowledging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Acknowledge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-green-600">
            <Check className="h-4 w-4 mr-2" />
            Resolve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved. Add a comment describing the resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolveComment">Resolution Comment</Label>
              <Textarea
                id="resolveComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleResolve}
              disabled={isResolving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-600">
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Alert</DialogTitle>
            <DialogDescription>
              Dismiss this alert as a false positive. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dismissComment">Reason for Dismissal</Label>
              <Textarea
                id="dismissComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explain why this is a false positive..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleDismiss}
              disabled={isDismissing}
              variant="destructive"
            >
              {isDismissing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dismiss Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Alert</DialogTitle>
            <DialogDescription>
              Assign this alert to a field technician for resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech1">John Doe (Field Technician)</SelectItem>
                  <SelectItem value="tech2">Jane Smith (Field Technician)</SelectItem>
                  <SelectItem value="tech3">Mike Johnson (Field Technician)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAssign}>
              Assign Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

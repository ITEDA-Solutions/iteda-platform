'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: any;
  onSuccess: () => void;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'regional_manager', label: 'Regional Manager' },
  { value: 'field_technician', label: 'Field Technician' },
];

export function StaffForm({ open, onOpenChange, staff, onSuccess }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: staff?.email || '',
    password: '',
    full_name: staff?.full_name || '',
    role: staff?.role || '',
    region_id: staff?.region_id || '',
  });

  useEffect(() => {
    if (open) {
      loadRegions();
      if (staff) {
        setFormData({
          email: staff.email || '',
          password: '',
          full_name: staff.full_name || '',
          role: staff.role || '',
          region_id: staff.region_id || '',
        });
      }
    }
  }, [open, staff]);

  const loadRegions = async () => {
    try {
      const response = await fetch('/api/data/regions');
      const result = await response.json();
      if (result.regions) {
        setRegions(result.regions);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = staff ? `/api/staff/${staff.id}` : '/api/staff';
      const method = staff ? 'PUT' : 'POST';

      // For updates, only send changed fields
      const payload = staff 
        ? { full_name: formData.full_name, role: formData.role, region_id: formData.region_id || null }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save staff member');
      }

      toast.success(staff ? 'Staff member updated successfully!' : 'Staff member created successfully!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form if creating new
      if (!staff) {
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: '',
          region_id: '',
        });
      }
    } catch (error: any) {
      console.error('Error saving staff member:', error);
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {staff ? 'Update staff member information and role' : 'Create a new staff account with role assignment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          {!staff && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(formData.role === 'regional_manager' || formData.role === 'field_technician') && (
            <div className="space-y-2">
              <Label htmlFor="region_id">Region</Label>
              <Select
                value={formData.region_id}
                onValueChange={(value) => setFormData({ ...formData, region_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : staff ? 'Update Staff' : 'Create Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

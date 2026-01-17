'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2, Shield, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StaffMember {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  region?: string;
  createdAt: string;
}

interface NewStaffMember {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
  region: string;
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  { value: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-800' },
  { value: 'regional_manager', label: 'Regional Manager', color: 'bg-green-100 text-green-800' },
  { value: 'field_technician', label: 'Field Technician', color: 'bg-yellow-100 text-yellow-800' },
];

const REGIONS = [
  'Nairobi', 'Central', 'Coast', 'Western', 'Eastern', 'Nyanza', 'Rift Valley', 'North Eastern'
];

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [newStaffMember, setNewStaffMember] = useState<NewStaffMember>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: '',
    region: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      setStaff(data);
    } catch (error: any) {
      toast({
        title: "Error loading staff",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStaffMember = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newStaffMember),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }

      const createdStaffMember = await response.json();
      setStaff([...staff, createdStaffMember]);
      setIsCreateDialogOpen(false);
      setNewStaffMember({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: '',
        region: '',
      });

      toast({
        title: "Staff member created",
        description: `${createdStaffMember.email} has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating staff member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateStaffMember = async () => {
    if (!editingStaffMember) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch(`/api/staff/${editingStaffMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editingStaffMember.fullName,
          phone: editingStaffMember.phone,
          role: editingStaffMember.role,
          region: editingStaffMember.region,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update staff member');
      }

      const updatedStaffMember = await response.json();
      setStaff(staff.map(staffMember => staffMember.id === updatedStaffMember.id ? updatedStaffMember : staffMember));
      setIsEditDialogOpen(false);
      setEditingStaffMember(null);

      toast({
        title: "Staff member updated",
        description: `${updatedStaffMember.email} has been updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating staff member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteStaffMember = async (userId: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch(`/api/staff/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete staff member');
      }

      setStaff(staff.filter(staffMember => staffMember.id !== userId));

      toast({
        title: "Staff member deleted",
        description: `${userEmail} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting staff member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) {
      return <Badge variant="secondary">No Role</Badge>;
    }

    const roleConfig = ROLES.find(r => r.value === role);
    if (!roleConfig) {
      return <Badge variant="secondary">{role}</Badge>;
    }

    return (
      <Badge className={roleConfig.color}>
        {roleConfig.label}
      </Badge>
    );
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaffMember({ ...staffMember });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage staff, roles, and permissions
            </p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to the system with appropriate role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaffMember.email}
                  onChange={(e) => setNewStaffMember({ ...newStaffMember, email: e.target.value })}
                  className="col-span-3"
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newStaffMember.password}
                  onChange={(e) => setNewStaffMember({ ...newStaffMember, password: e.target.value })}
                  className="col-span-3"
                  placeholder="Temporary password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={newStaffMember.fullName}
                  onChange={(e) => setNewStaffMember({ ...newStaffMember, fullName: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newStaffMember.phone}
                  onChange={(e) => setNewStaffMember({ ...newStaffMember, phone: e.target.value })}
                  className="col-span-3"
                  placeholder="+254700000000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newStaffMember.role}
                  onValueChange={(value) => setNewStaffMember({ ...newStaffMember, role: value })}
                >
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right">
                  Region
                </Label>
                <Select
                  value={newStaffMember.region}
                  onValueChange={(value) => setNewStaffMember({ ...newStaffMember, region: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={createStaffMember}
                disabled={!newStaffMember.email || !newStaffMember.password || !newStaffMember.role}
              >
                Create Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Staff ({staff.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.fullName || 'No name'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.phone || 'No phone'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.region || 'No region'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.email}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteStaffMember(user.id, user.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {staff.length === 0 && (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No staff found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information, role, and permissions.
            </DialogDescription>
          </DialogHeader>
          {editingStaffMember && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  value={editingStaffMember.email}
                  disabled
                  className="col-span-3 bg-muted"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="edit-fullName"
                  value={editingStaffMember.fullName || ''}
                  onChange={(e) => setEditingStaffMember({ ...editingStaffMember, fullName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editingStaffMember.phone || ''}
                  onChange={(e) => setEditingStaffMember({ ...editingStaffMember, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editingStaffMember.role || ''}
                  onValueChange={(value) => setEditingStaffMember({ ...editingStaffMember, role: value })}
                >
                  <SelectTrigger className="col-span-3">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-region" className="text-right">
                  Region
                </Label>
                <Select
                  value={editingStaffMember.region || ''}
                  onValueChange={(value) => setEditingStaffMember({ ...editingStaffMember, region: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={updateStaffMember}>
              Update Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;

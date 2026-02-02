'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, UserPlus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface StaffRole {
  id: string;
  staff_id: string;
  role: 'super_admin' | 'admin' | 'regional_manager' | 'field_technician';
  region: string | null;
  created_at: string;
}

interface StaffMember {
  profile: Profile;
  role: StaffRole | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        fetch('/api/data/profiles'),
        fetch('/api/data/staff-roles'),
      ]);

      const [profilesData, rolesData] = await Promise.all([
        profilesRes.json(),
        rolesRes.json(),
      ]);

      const profiles = profilesData.profiles || [];
      const roles = rolesData.roles || [];

      // Combine profiles with their roles
      const staffMembers = profiles.map((profile: Profile) => ({
        profile,
        role: roles.find((r: StaffRole) => r.staff_id === profile.id) || null,
      }));

      setStaff(staffMembers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load staff',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const variants: Record<string, any> = {
      super_admin: 'destructive',
      admin: 'default',
      regional_manager: 'secondary',
      field_technician: 'outline',
    };
    
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      regional_manager: 'Regional Manager',
      field_technician: 'Field Technician',
    };

    return <Badge variant={variants[role] || 'outline'}>{labels[role] || role}</Badge>;
  };

  const filteredStaff = staff.filter(member =>
    member.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleCounts = () => {
    return {
      total: staff.length,
      super_admin: staff.filter(s => s.role?.role === 'super_admin').length,
      admin: staff.filter(s => s.role?.role === 'admin').length,
      regional_manager: staff.filter(s => s.role?.role === 'regional_manager').length,
      field_technician: staff.filter(s => s.role?.role === 'field_technician').length,
      no_role: staff.filter(s => !s.role).length,
    };
  };

  const counts = getRoleCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">
            Manage staff members and their role assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStaff} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.super_admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regional Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{counts.regional_manager}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Field Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.field_technician}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">No Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{counts.no_role}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            View and manage all staff members and their roles
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading staff members...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No staff members found matching your search.' : 'No staff members found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.profile.id}>
                      <TableCell className="font-medium">
                        {member.profile.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{member.profile.email}</TableCell>
                      <TableCell>{member.profile.phone || 'N/A'}</TableCell>
                      <TableCell>{getRoleBadge(member.role?.role || null)}</TableCell>
                      <TableCell>{member.role?.region || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(member.profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

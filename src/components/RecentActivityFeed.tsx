'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Wrench, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'alert' | 'status_change' | 'maintenance' | 'deployment';
  title: string;
  description: string;
  timestamp: string;
  severity?: string;
  dryerId?: string;
}

export function RecentActivityFeed({ limit = 10 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const activities: Activity[] = [];

      // Fetch recent alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('id, title, message, triggered_at, priority, dryer_id, dryers(dryer_id)')
        .order('triggered_at', { ascending: false })
        .limit(5);

      alerts?.forEach(alert => {
        activities.push({
          id: alert.id,
          type: 'alert',
          title: alert.title || 'Alert',
          description: `${alert.dryers?.dryer_id}: ${alert.message}`,
          timestamp: alert.triggered_at,
          severity: alert.priority,
          dryerId: alert.dryer_id,
        });
      });

      // Fetch recent maintenance
      const { data: maintenance } = await supabase
        .from('maintenance_schedules')
        .select('id, maintenance_type, completed_date, dryer_id, dryers(dryer_id)')
        .not('completed_date', 'is', null)
        .order('completed_date', { ascending: false })
        .limit(3);

      maintenance?.forEach(m => {
        activities.push({
          id: m.id,
          type: 'maintenance',
          title: 'Maintenance Completed',
          description: `${m.dryers?.dryer_id}: ${m.maintenance_type}`,
          timestamp: m.completed_date!,
          dryerId: m.dryer_id,
        });
      });

      // Fetch recently deployed dryers
      const { data: newDryers } = await supabase
        .from('dryers')
        .select('id, dryer_id, deployment_date')
        .order('deployment_date', { ascending: false })
        .limit(3);

      newDryers?.forEach(dryer => {
        const deploymentDate = new Date(dryer.deployment_date);
        const daysSinceDeployment = Math.floor(
          (Date.now() - deploymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceDeployment <= 7) {
          activities.push({
            id: dryer.id,
            type: 'deployment',
            title: 'New Dryer Deployed',
            description: `${dryer.dryer_id} has been deployed`,
            timestamp: dryer.deployment_date,
            dryerId: dryer.id,
          });
        }
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activities.slice(0, limit));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className={`h-4 w-4 ${
          severity === 'critical' ? 'text-red-500' : 
          severity === 'high' ? 'text-orange-500' : 
          'text-yellow-500'
        }`} />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'deployment':
        return <Plus className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="mt-1">
                  {getActivityIcon(activity.type, activity.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    {activity.severity && (
                      <Badge variant={
                        activity.severity === 'critical' ? 'destructive' :
                        activity.severity === 'high' ? 'default' :
                        'secondary'
                      }>
                        {activity.severity}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

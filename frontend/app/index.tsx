import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { isAuthenticated, role } = useAuth();

  const homePath = role === 'parking_owner'
    ? '/owner/overview'
    : role === 'vehicle_owner'
    ? '/vehicle_owner'
    : '/attendant/monitor';

  return <Redirect href={isAuthenticated ? homePath : '/get_started'} />;
}

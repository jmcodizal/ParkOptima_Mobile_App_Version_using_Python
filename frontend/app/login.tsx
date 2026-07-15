import { useLocalSearchParams } from 'expo-router';

import AttendantLogin from './attendant_login';
import ParkingOwnerLogin from './parking_owner_login';

export default function LoginRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  if (role === 'parking_owner') {
    return <ParkingOwnerLogin />;
  }
  
  return <AttendantLogin />;
}

import { useLocalSearchParams } from 'expo-router';

import AttendantLogin from './attendant_login';
import ParkingOwnerLogin from './parking_owner_login';
import VehicleOwnerLogin from './vehicle_owner';

export default function LoginRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  if (role === 'parking_owner') {
    return <ParkingOwnerLogin />;
  }

  if (role === 'vehicle_owner') {
    return <VehicleOwnerLogin />;
  }

  return <AttendantLogin />;
}

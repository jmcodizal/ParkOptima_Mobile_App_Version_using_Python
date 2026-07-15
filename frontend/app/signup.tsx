import { useLocalSearchParams } from 'expo-router';

import AttendantSignup from './attendant_signup';
import ParkingOwnerSignup from './parking_owner_signup';

export default function SignupRoute() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  if (role === 'parking_owner') {
    return <ParkingOwnerSignup />;
  }

  return <AttendantSignup />;
}

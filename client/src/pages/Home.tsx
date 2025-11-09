import { useState } from 'react';
import LandingHero from '@/components/LandingHero';
import BookingFlow from './BookingFlow';

export default function Home() {
  const [showBooking, setShowBooking] = useState(false);

  if (showBooking) {
    return <BookingFlow />;
  }

  return (
    <LandingHero
      onBookingClick={() => setShowBooking(true)}
      onLoginClick={() => console.log('Login clicked')}
    />
  );
}

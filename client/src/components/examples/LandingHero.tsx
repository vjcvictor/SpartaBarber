import LandingHero from '../LandingHero';

export default function LandingHeroExample() {
  return (
    <LandingHero 
      onBookingClick={() => console.log('Booking clicked')} 
      onLoginClick={() => console.log('Login clicked')}
    />
  );
}

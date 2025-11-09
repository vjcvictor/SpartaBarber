import BookingProgress from '../BookingProgress';

export default function BookingProgressExample() {
  return (
    <div className="space-y-8 p-8 bg-background">
      <div>
        <p className="text-sm text-muted-foreground mb-4">Step 1</p>
        <BookingProgress currentStep={1} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Step 2</p>
        <BookingProgress currentStep={2} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Step 3</p>
        <BookingProgress currentStep={3} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Step 4</p>
        <BookingProgress currentStep={4} />
      </div>
    </div>
  );
}

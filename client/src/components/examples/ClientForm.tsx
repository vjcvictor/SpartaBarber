import ClientForm from '../ClientForm';

export default function ClientFormExample() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    alert('Formulario enviado! Ver consola para datos.');
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <ClientForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

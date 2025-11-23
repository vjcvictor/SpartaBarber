// Test script to verify clientsInPeriod calculation

const appointments = [
    { clientId: '1', startDateTime: new Date('2025-11-20') },
    { clientId: '2', startDateTime: new Date('2025-11-21') },
    { clientId: '1', startDateTime: new Date('2025-11-21') }, // Cliente repetido
    { clientId: '3', startDateTime: new Date('2025-11-22') },
    { clientId: '2', startDateTime: new Date('2025-11-22') }, // Cliente repetido
];

// Simular cálculo de clientsInPeriod
const uniqueClientIds = new Set(appointments.map(appt => appt.clientId));
const clientsInPeriod = uniqueClientIds.size;

console.log('Total appointments:', appointments.length);
console.log('Unique client IDs:', Array.from(uniqueClientIds));
console.log('Clients in period:', clientsInPeriod); // Debería ser 3

// Verificar que el cálculo es correcto
if (clientsInPeriod === 3) {
    console.log('✅ Calculation is correct!');
} else {
    console.log('❌ Calculation failed!');
}

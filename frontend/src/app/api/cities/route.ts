import { NextResponse } from 'next/server';

interface CityItem {
  id: number;
  name: string;
  department: string;
  daneCode?: string;
}

const DANE_COLOMBIAN_CITIES: CityItem[] = [
  // Antioquia
  { id: 1, name: 'Medellín', department: 'Antioquia', daneCode: '05001' },
  { id: 2, name: 'Envigado', department: 'Antioquia', daneCode: '05266' },
  { id: 3, name: 'Itagüí', department: 'Antioquia', daneCode: '05360' },
  { id: 4, name: 'Bello', department: 'Antioquia', daneCode: '05088' },
  { id: 5, name: 'Sabaneta', department: 'Antioquia', daneCode: '05631' },
  { id: 6, name: 'Rionegro', department: 'Antioquia', daneCode: '05615' },
  { id: 7, name: 'La Estrella', department: 'Antioquia', daneCode: '05380' },
  { id: 8, name: 'Caldas', department: 'Antioquia', daneCode: '05129' },

  // Bogotá D.C.
  { id: 10, name: 'Bogotá D.C.', department: 'Bogotá D.C.', daneCode: '11001' },

  // Valle del Cauca
  { id: 20, name: 'Cali', department: 'Valle del Cauca', daneCode: '76001' },
  { id: 21, name: 'Palmira', department: 'Valle del Cauca', daneCode: '76520' },
  { id: 22, name: 'Yumbo', department: 'Valle del Cauca', daneCode: '76892' },
  { id: 23, name: 'Jamundí', department: 'Valle del Cauca', daneCode: '76364' },
  { id: 24, name: 'Tuluá', department: 'Valle del Cauca', daneCode: '76834' },
  { id: 25, name: 'Buga', department: 'Valle del Cauca', daneCode: '76111' },

  // Atlántico
  { id: 30, name: 'Barranquilla', department: 'Atlántico', daneCode: '08001' },
  { id: 31, name: 'Soledad', department: 'Atlántico', daneCode: '08758' },
  { id: 32, name: 'Puerto Colombia', department: 'Atlántico', daneCode: '08573' },

  // Cundinamarca
  { id: 40, name: 'Chía', department: 'Cundinamarca', daneCode: '25175' },
  { id: 41, name: 'Soacha', department: 'Cundinamarca', daneCode: '25754' },
  { id: 42, name: 'Zipaquirá', department: 'Cundinamarca', daneCode: '25899' },
  { id: 43, name: 'Cajicá', department: 'Cundinamarca', daneCode: '25126' },
  { id: 44, name: 'Mosquera', department: 'Cundinamarca', daneCode: '25473' },
  { id: 45, name: 'Funza', department: 'Cundinamarca', daneCode: '25286' },
  { id: 46, name: 'Facatativá', department: 'Cundinamarca', daneCode: '25269' },

  // Santander
  { id: 50, name: 'Bucaramanga', department: 'Santander', daneCode: '68001' },
  { id: 51, name: 'Floridablanca', department: 'Santander', daneCode: '68276' },
  { id: 52, name: 'Girón', department: 'Santander', daneCode: '68307' },
  { id: 53, name: 'Piedecuesta', department: 'Santander', daneCode: '68547' },

  // Bolívar
  { id: 60, name: 'Cartagena', department: 'Bolívar', daneCode: '13001' },

  // Risaralda
  { id: 70, name: 'Pereira', department: 'Risaralda', daneCode: '66001' },
  { id: 71, name: 'Dosquebradas', department: 'Risaralda', daneCode: '66170' },

  // Caldas
  { id: 80, name: 'Manizales', department: 'Caldas', daneCode: '17001' },

  // Quindío
  { id: 90, name: 'Armenia', department: 'Quindío', daneCode: '63001' },

  // Magdalena
  { id: 100, name: 'Santa Marta', department: 'Magdalena', daneCode: '47001' },

  // Meta
  { id: 110, name: 'Villavicencio', department: 'Meta', daneCode: '50001' },

  // Norte de Santander
  { id: 120, name: 'Cúcuta', department: 'Norte de Santander', daneCode: '54001' },

  // Nariño
  { id: 130, name: 'Pasto', department: 'Nariño', daneCode: '52001' },

  // Huila
  { id: 140, name: 'Neiva', department: 'Huila', daneCode: '41001' },

  // Tolima
  { id: 150, name: 'Ibagué', department: 'Tolima', daneCode: '73001' },
];

export async function GET() {
  const BASE_URL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337').replace(/\/$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${BASE_URL}/api/cities`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // If Strapi is unavailable or times out, fallback seamlessly to DANE dataset
  }

  return NextResponse.json({
    data: DANE_COLOMBIAN_CITIES.map((city) => ({
      id: city.id,
      name: city.name,
      department: city.department,
    })),
  });
}

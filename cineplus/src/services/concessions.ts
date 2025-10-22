// Service to fetch concession products (dulcería) from backend
export interface ApiConcessionProduct {
  id: number | string;
  name: string;
  description?: string;
  price: number | string;
  imageUrl?: string | null;
  category: 'COMBOS' | 'CANCHITA' | 'BEBIDAS' | 'SNACKS' | string;
}

export interface ProductoDulceria {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string | null;
  categoria: 'combos' | 'canchita' | 'bebidas' | 'snacks';
}

export type ProductosPorCategoria = {
  combos: ProductoDulceria[];
  canchita: ProductoDulceria[];
  bebidas: ProductoDulceria[];
  snacks: ProductoDulceria[];
};

const emptyGroups = (): ProductosPorCategoria => ({
  combos: [],
  canchita: [],
  bebidas: [],
  snacks: [],
});

function mapApiToProducto(api: ApiConcessionProduct): ProductoDulceria {
  const categoria = (api.category || '').toString().toLowerCase();
  return {
    id: String(api.id),
    nombre: api.name,
    descripcion: (api.description || '').toString(),
    precio: Number(api.price) || 0,
    imagen: api.imageUrl || undefined,
    categoria: (categoria === 'canchita' || categoria === 'cancha') ? 'canchita' :
               (categoria === 'bebidas' ? 'bebidas' :
               (categoria === 'snacks' ? 'snacks' : 'combos'))
  };
}

// Fetch products for a cinema id. Returns grouped products used by the frontend.
export async function fetchConcessionsByCinema(cinemaId: string | null): Promise<ProductosPorCategoria> {
  if (!cinemaId) return emptyGroups();

  try {
    const res = await fetch(`/api/concessions?cinema=${encodeURIComponent(cinemaId)}`);
    if (!res.ok) {
      // non-2xx — return empty groups so UI can fallback
      return emptyGroups();
    }
    const data: ApiConcessionProduct[] = await res.json();

    const groups = emptyGroups();
    data.forEach(item => {
      const p = mapApiToProducto(item);
      switch (p.categoria) {
        case 'combos': groups.combos.push(p); break;
        case 'canchita': groups.canchita.push(p); break;
        case 'bebidas': groups.bebidas.push(p); break;
        case 'snacks': groups.snacks.push(p); break;
        default: groups.combos.push(p); break;
      }
    });

    return groups;
  } catch {
    // network or parse error — return empty groups and let caller handle fallback
    return emptyGroups();
  }
}

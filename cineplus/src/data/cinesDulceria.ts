import { combos, canchita, bebidas, snacks } from './dulceria';

interface ProductoDulceria {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  categoria: 'combos' | 'canchita' | 'bebidas' | 'snacks';
}

export interface CineDulceria {
  cineNombre: string;
  productos: {
    combos: ProductoDulceria[];
    canchita: ProductoDulceria[];
    bebidas: ProductoDulceria[];
    snacks: ProductoDulceria[];
  };
}

export const cinesDulceria: CineDulceria[] = [
  {
    cineNombre: "Cineplus Asia",
    productos: {
      combos: [combos[0], combos[1], combos[4]],
      canchita: [canchita[0], canchita[1], canchita[5], canchita[6]],
      bebidas: [bebidas[0], bebidas[1], bebidas[2], bebidas[6]],
      snacks: [snacks[0], snacks[1], snacks[7], snacks[8]]
    }
  },
  {
    cineNombre: "Cineplus Gamarra",
    productos: {
      combos: [combos[1], combos[2], combos[5]],
      canchita: [canchita[1], canchita[2], canchita[3], canchita[7]],
      bebidas: [bebidas[0], bebidas[3], bebidas[4], bebidas[5]],
      snacks: [snacks[2], snacks[3], snacks[4], snacks[9], snacks[10]]
    }
  },
  {
    cineNombre: "Cineplus Jockey Plaza",
    productos: {
      combos: [combos[0], combos[3], combos[5]],
      canchita: [canchita[0], canchita[4], canchita[6], canchita[7]],
      bebidas: [bebidas[1], bebidas[2], bebidas[5], bebidas[7]],
      snacks: [snacks[0], snacks[5], snacks[6], snacks[11]]
    }
  },
  {
    cineNombre: "Cineplus Lambramani",
    productos: {
      combos: [combos[2], combos[4]],
      canchita: [canchita[2], canchita[3], canchita[5]],
      bebidas: [bebidas[2], bebidas[3], bebidas[6]],
      snacks: [snacks[1], snacks[4], snacks[8], snacks[9]]
    }
  },
  {
    cineNombre: "Cineplus Mall Ave Pza Arequipa",
    productos: {
      combos: [combos[1], combos[3], combos[4], combos[5]],
      canchita: [canchita[1], canchita[3], canchita[4], canchita[6]],
      bebidas: [bebidas[0], bebidas[4], bebidas[5], bebidas[7]],
      snacks: [snacks[2], snacks[6], snacks[7], snacks[10], snacks[11]]
    }
  },
  {
    cineNombre: "Cineplus MallPlaza Angamos",
    productos: {
      combos: [combos[0], combos[2], combos[5]],
      canchita: [canchita[0], canchita[2], canchita[7]],
      bebidas: [bebidas[1], bebidas[3], bebidas[6], bebidas[7]],
      snacks: [snacks[3], snacks[5], snacks[8], snacks[9], snacks[11]]
    }
  },
  {
    cineNombre: "Cineplus Mallplaza Bellavista",
    productos: {
      combos: [combos[0], combos[1], combos[2], combos[3], combos[4]],
      canchita: [canchita[0], canchita[1], canchita[4], canchita[5], canchita[6]],
      bebidas: [bebidas[0], bebidas[2], bebidas[4], bebidas[6], bebidas[7]],
      snacks: [snacks[0], snacks[1], snacks[6], snacks[7], snacks[10], snacks[11]]
    }
  }
];

export const getProductosByCine = (cineNombre: string): CineDulceria['productos'] | null => {
  const cine = cinesDulceria.find(c => c.cineNombre === cineNombre);
  return cine ? cine.productos : null;
};
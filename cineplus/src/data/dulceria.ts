export interface ProductoDulceria {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  categoria: 'combos' | 'canchita' | 'bebidas' | 'snacks';
}

// COMBOS
export const combos: ProductoDulceria[] = [
  {
    id: 'combo1',
    nombre: 'Combo Trio',
    descripcion: 'Canchita grande + Gaseosa grande + Hot dog',
    precio: 25.90,
    categoria: 'combos'
  },
  {
    id: 'combo2', 
    nombre: 'Combo Sal',
    descripcion: 'Canchita mediana + Gaseosa mediana + Nachos',
    precio: 18.50,
    categoria: 'combos'
  },
  {
    id: 'combo3',
    nombre: 'Combo Familiar',
    descripcion: 'Canchita gigante + 2 Gaseosas + Tequeños x4',
    precio: 32.90,
    categoria: 'combos'
  },
  {
    id: 'combo4',
    nombre: 'Combo Dulce',
    descripcion: 'Canchita grande + Frugos + Nuggets x8',
    precio: 22.90,
    categoria: 'combos'
  },
  {
    id: 'combo5',
    nombre: 'Combo Pareja',
    descripcion: 'Canchita grande + 2 Gaseosas medianas',
    precio: 21.90,
    categoria: 'combos'
  },
  {
    id: 'combo6',
    nombre: 'Combo Premium',
    descripcion: 'Canchita gigante + Gaseosa grande + Hamburguesa',
    precio: 35.90,
    categoria: 'combos'
  }
];

// CANCHITA
export const canchita: ProductoDulceria[] = [
  {
    id: 'canchita1',
    nombre: 'Canchita Grande Salada',
    descripcion: 'Porción grande de canchita con sal',
    precio: 16.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita2',
    nombre: 'Canchita Mediana Salada', 
    descripcion: 'Porción mediana de canchita con sal',
    precio: 15.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita3',
    nombre: 'Canchita Gigante Salada',
    descripcion: 'Porción gigante de canchita con sal',
    precio: 28.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita4',
    nombre: 'Canchita Grande Dulce',
    descripcion: 'Porción grande de canchita dulce',
    precio: 17.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita5',
    nombre: 'Canchita Mediana Dulce',
    descripcion: 'Porción mediana de canchita dulce', 
    precio: 16.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita6',
    nombre: 'Canchita Pequeña Salada',
    descripcion: 'Porción pequeña de canchita con sal',
    precio: 12.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita7',
    nombre: 'Canchita Caramelo',
    descripcion: 'Canchita mediana con caramelo',
    precio: 18.90,
    categoria: 'canchita'
  },
  {
    id: 'canchita8',
    nombre: 'Canchita Mantequilla',
    descripcion: 'Canchita grande con mantequilla',
    precio: 19.90,
    categoria: 'canchita'
  }
];

// BEBIDAS
export const bebidas: ProductoDulceria[] = [
  {
    id: 'bebida1',
    nombre: 'Gaseosa Grande',
    descripcion: 'Coca Cola 500ml',
    precio: 11.80,
    categoria: 'bebidas'
  },
  {
    id: 'bebida2',
    nombre: 'Agua Sin Gas',
    descripcion: 'Agua mineral 500ml',
    precio: 5.60,
    categoria: 'bebidas'
  },
  {
    id: 'bebida3',
    nombre: 'Frugos 300ml',
    descripcion: 'Jugo de frutas sabor durazno',
    precio: 6.50,
    categoria: 'bebidas'
  },
  {
    id: 'bebida4',
    nombre: 'Gaseosa Mediana',
    descripcion: 'Coca Cola 350ml',
    precio: 9.50,
    categoria: 'bebidas'
  },
  {
    id: 'bebida5',
    nombre: 'Inca Kola Grande',
    descripcion: 'Inca Kola 500ml',
    precio: 11.80,
    categoria: 'bebidas'
  },
  {
    id: 'bebida6',
    nombre: 'Sprite Grande',
    descripcion: 'Sprite 500ml',
    precio: 11.80,
    categoria: 'bebidas'
  },
  {
    id: 'bebida7',
    nombre: 'Jugo de Naranja',
    descripcion: 'Jugo natural de naranja 400ml',
    precio: 8.50,
    categoria: 'bebidas'
  },
  {
    id: 'bebida8',
    nombre: 'Agua con Gas',
    descripcion: 'Agua mineral con gas 500ml',
    precio: 6.50,
    categoria: 'bebidas'
  }
];

// SNACKS
export const snacks: ProductoDulceria[] = [
  {
    id: 'snack1',
    nombre: 'Hot Dog Frankfurter',
    descripcion: 'Hot dog con salchicha alemana y salsas',
    precio: 12.90,
    categoria: 'snacks'
  },
  {
    id: 'snack2',
    nombre: 'Nachos con Queso',
    descripcion: 'Nachos crujientes con salsa de queso',
    precio: 14.50,
    categoria: 'snacks'
  },
  {
    id: 'snack3',
    nombre: 'Papas Fritas',
    descripcion: 'Papas fritas crujientes porción grande',
    precio: 8.90,
    categoria: 'snacks'
  },
  {
    id: 'snack4',
    nombre: 'Tequeños x4 un',
    descripcion: '4 tequeños de queso fritos',
    precio: 10.50,
    categoria: 'snacks'
  },
  {
    id: 'snack5',
    nombre: 'Nuggets x8',
    descripcion: '8 nuggets de pollo crujientes',
    precio: 15.90,
    categoria: 'snacks'
  },
  {
    id: 'snack6',
    nombre: 'Salchipapas',
    descripcion: 'Papas fritas con salchicha y salsas',
    precio: 13.50,
    categoria: 'snacks'
  },
  {
    id: 'snack7',
    nombre: 'Hamburguesa Clásica',
    descripcion: 'Hamburguesa con carne, lechuga y tomate',
    precio: 16.90,
    categoria: 'snacks'
  },
  {
    id: 'snack8',
    nombre: 'Pizza Personal',
    descripcion: 'Pizza individual de pepperoni',
    precio: 18.90,
    categoria: 'snacks'
  },
  {
    id: 'snack9',
    nombre: 'Sandwich Club',
    descripcion: 'Sandwich triple con pollo, tocino y verduras',
    precio: 17.50,
    categoria: 'snacks'
  },
  {
    id: 'snack10',
    nombre: 'Alitas BBQ x6',
    descripcion: '6 alitas de pollo con salsa BBQ',
    precio: 19.90,
    categoria: 'snacks'
  },
  {
    id: 'snack11',
    nombre: 'Quesadilla',
    descripcion: 'Quesadilla de queso con guacamole',
    precio: 14.90,
    categoria: 'snacks'
  },
  {
    id: 'snack12',
    nombre: 'Wrap de Pollo',
    descripcion: 'Wrap con pollo, lechuga y salsa ranch',
    precio: 15.50,
    categoria: 'snacks'
  }
];
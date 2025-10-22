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
    nombre: 'Combo caliente',
    descripcion: 'Canchita grande + Gaseosa grande + Hot dog',
    precio: 50.20,
    imagen: 'comboperrocaliente.png',
    categoria: 'combos'
  },
  {
    id: 'combo2', 
    nombre: 'Combo Sal',
    descripcion: 'Canchita mediana + Gaseosa grande + Nachos',
    precio: 48.30,
    imagen: 'combosal.png',
    categoria: 'combos'
  },
  {
    id: 'combo3',
    nombre: 'Combo Familiar',
    descripcion: '4 Canchitas grandes + 3 Gaseosas grandes',
    precio: 149.00,
    imagen: '4x3.png',
    categoria: 'combos'
  },
  {
    id: 'combo4',
    nombre: 'Combo Dulce',
    descripcion: 'Canchita grande dulce + Frugos + Nuggets x6',
    precio: 47.40,
    imagen: 'combo-dulce-nugguets-frugos.png',
    categoria: 'combos'
  },
  {
    id: 'combo5',
    nombre: 'Combo Pareja',
    descripcion: '2 Canchitas medianas + 2 Gaseosas grandes',
    precio: 69.90,
    imagen: 'combopareja.png',
    categoria: 'combos'
  },
  {
    id: 'combo6',
    nombre: 'Combo Burger Premium',
    descripcion: 'Canchita gigante + 2 Gaseosas grandes + Hamburguesa',
    precio: 35.90,
    imagen: 'combo-premium.png',
    categoria: 'combos'
  }
];

// CANCHITA
export const canchita: ProductoDulceria[] = [
  {
    id: 'canchita1',
    nombre: 'Canchita Gigante Salada',
    descripcion: 'Porción gigante de canchita con sal',
    precio: 34.90,
    imagen: 'canchitagigantesalada.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita2',
    nombre: 'Canchita Grande Salada',
    descripcion: 'Porción grande de canchita con sal',
    precio: 29.90,
    imagen: 'canchitagrandesalada.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita3',
    nombre: 'Canchita Grande Dulce',
    descripcion: 'Porción grande de canchita dulce',
    precio: 31.90,
    imagen: 'Canchitagrandedulce.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita4',
    nombre: 'Canchita Mediana Salada', 
    descripcion: 'Porción mediana de canchita con sal',
    precio: 26.90,
    imagen: 'Saladamediana.png',
    categoria: 'canchita'
  },  
  {
    id: 'canchita5',
    nombre: 'Canchita Mediana Dulce',
    descripcion: 'Porción mediana de canchita dulce', 
    precio: 27.90,
    imagen: 'dulce-mediana.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita6',
    nombre: 'Canchita Kids Salada',
    descripcion: 'Porción Kids de canchita con sal',
    precio: 11.90,
    imagen: 'canchitapeuqeña.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita7',
    nombre: 'Canchita Kids Dulce',
    descripcion: 'Canchita Kids dulce',
    precio: 12.90,
    imagen: 'Canchitapequeñadulce.png',
    categoria: 'canchita'
  },
  {
    id: 'canchita8',
    nombre: 'Canchita Mantequilla',
    descripcion: 'Canchita grande con mantequilla',
    precio: 31.90,
    imagen: 'canchita-mantequilla.png',
    categoria: 'canchita'
  }
];

// BEBIDAS
export const bebidas: ProductoDulceria[] = [
  {
    id: 'bebida1',
    nombre: 'Coca Cola Grande',
    descripcion: 'Coca Cola 500ml',
    precio: 11.90,
    imagen: 'GASEOSA.png',
    categoria: 'bebidas'
  },
  {
    id: 'bebida2',
    nombre: 'Inca Kola Grande',
    descripcion: 'Inca Kola 500ml',
    precio: 11.90,
    imagen: 'GASEOSA-GRANDE-INKA.png',
    categoria: 'bebidas'
  },  
 {
    id: 'bebida3',
    nombre: 'Sprite Grande',
    descripcion: 'Sprite 500ml',
    precio: 11.90,
    imagen: 'GASEOSA-GRANDE-SPRITE.png',
    categoria: 'bebidas'
  },
  {
    id: 'bebida4',
    nombre: 'Jugo de Naranja',
    descripcion: 'Jugo natural de naranja 400ml',
    precio: 11.90,
    imagen: 'orangejuice.png',
    categoria: 'bebidas'
  },
  {
    id: 'bebida5',
    nombre: 'Frugos del valle',
    descripcion: 'Frugos 300ml',
    precio: 6.90,
    imagen: 'frugos.png',
    categoria: 'bebidas'
  },
  {
    id: 'bebida6',
    nombre: 'Agua con Gas',
    descripcion: 'Agua mineral con gas 500ml',
    precio: 6.90,
    imagen: 'aguacongas.png',
    categoria: 'bebidas'
  },
  {
    id: 'bebida7',
    nombre: 'Agua Sin Gas',
    descripcion: 'Agua mineral 500ml',
    precio: 5.90,
    imagen: 'aguasanluis.png',
    categoria: 'bebidas'
  },
];

// SNACKS
export const snacks: ProductoDulceria[] = [
  {
    id: 'snack1',
    nombre: 'Hot Dog Frankfurter',
    descripcion: 'Hot dog con salchicha alemana y salsas',
    precio: 13.90,
    imagen: 'perrocaliente.png',
    categoria: 'snacks'
  },
  {
    id: 'snack2',
    nombre: 'Nachos con Queso',
    descripcion: 'Nachos crujientes con salsa de queso',
    precio: 14.90,
    imagen: 'NACHOS.png',
    categoria: 'snacks'
  },
  {
    id: 'snack3',
    nombre: 'Papas Fritas',
    descripcion: 'Papas fritas crujientes porción grande',
    precio: 7.90,
    imagen: 'papas-fritas.png',
    categoria: 'snacks'
  },
  {
    id: 'snack4',
    nombre: 'Tequeños x4 un',
    descripcion: '4 tequeños de queso fritos',
    precio: 10.90,
    imagen: 'tequeños.png',
    categoria: 'snacks'
  },
  {
    id: 'snack5',
    nombre: 'Nuggets x6',
    descripcion: '6 nuggets de pollo crujientes',
    precio: 13.90,
    imagen: 'nuggets.png',
    categoria: 'snacks'
  },
  {
    id: 'snack6',
    nombre: 'Salchipapas',
    descripcion: 'Papas fritas con salchicha y salsas',
    precio: 14.90,
    imagen: 'SALCHIPAPA.png',
    categoria: 'snacks'
  },
  {
    id: 'snack7',
    nombre: 'Hamburguesa Clásica',
    descripcion: 'Hamburguesa con carne, lechuga y tomate',
    precio: 16.90,
    imagen: 'hamburguesa-clasica.png',
    categoria: 'snacks'
  },
  {
    id: 'snack8',
    nombre: 'Pizza Personal',
    descripcion: 'Pizza individual de pepperoni',
    precio: 18.90,
    imagen: 'pizzacajacuadrada.png',
    categoria: 'snacks'
  },
  {
    id: 'snack9',
    nombre: 'Sandwich Club',
    descripcion: 'Sandwich triple con pollo, tocino y verduras',
    precio: 16.90,
    imagen: 'Sandwichfinal.png',
    categoria: 'snacks'
  },
  {
    id: 'snack10',
    nombre: 'Alitas BBQ x7',
    descripcion: '7 alitas de pollo con salsa BBQ',
    precio: 18.90,
    imagen: 'alitasbbq.png',
    categoria: 'snacks'
  },
  {
    id: 'snack11',
    nombre: 'Quesadilla',
    descripcion: 'Quesadilla de queso con guacamole',
    precio: 15.90,
    imagen: 'quesadilla.png',
    categoria: 'snacks'
  },
  {
    id: 'snack12',
    nombre: 'Wrap de Pollo',
    descripcion: 'Wrap con pollo, lechuga y salsa ranch',
    precio: 19.90,
    imagen: 'wrap-de-pollo.png',
    categoria: 'snacks'
  }
];
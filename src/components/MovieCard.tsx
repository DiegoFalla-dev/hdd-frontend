import React from 'react';
import { ShoppingCart, PlusCircle } from 'react-feather';

interface Pelicula {
	id: string;
	titulo: string;
	genero?: string;
	imagenCard?: string;
}

interface MovieCardProps {
	pelicula: Pelicula;
	showEstrenoLabel?: boolean;
	showPreventaLabel?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ pelicula, showEstrenoLabel = false, showPreventaLabel = false }) => {
	return (
		<div className="relative rounded overflow-hidden group" style={{ background: 'var(--cineplus-gray-dark)' }}>
			{pelicula.imagenCard ? (
				<img src={pelicula.imagenCard} alt={pelicula.titulo} className="object-cover w-full h-full" />
			) : (
				<div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--cineplus-gray-medium)' }}>
					<div className="text-center p-4">
						<h3 className="font-bold text-lg mb-2" style={{ color: 'var(--cineplus-gray-light)' }}>{pelicula.titulo}</h3>
						<p className="text-sm" style={{ color: 'var(--cineplus-gray)' }}>{pelicula.genero}</p>
					</div>
				</div>
			)}

			{showEstrenoLabel && (
				<span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg">Estreno</span>
			)}
			{showPreventaLabel && (
				<span className="absolute left-0 top-2 -rotate-12 bg-[#e50914] text-white px-4 py-1 text-base font-bold shadow-lg">Pre-venta</span>
			)}

			<div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50">
				<button className="flex items-center gap-2 bg-[#e50914] text-white font-bold px-6 py-2 rounded-full" onClick={() => window.location.href = `/boletos?pelicula=${pelicula.id}`}>
					<ShoppingCart size={16} /> Comprar
				</button>
				<button className="flex items-center gap-2 bg-[#0a3cff] text-white font-bold px-6 py-2 rounded-full" onClick={() => window.location.href = `/detalle?pelicula=${pelicula.id}`}>
					<PlusCircle size={16} /> Ver detalles
				</button>
			</div>
		</div>
	);
};

export default MovieCard;

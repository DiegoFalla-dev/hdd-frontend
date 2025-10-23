import React from 'react';
import { ShoppingCart, PlusCircle } from 'react-feather';
import { useNavigate } from 'react-router-dom';

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

// MovieCard shows a single movie. Navigation to details uses the movie's id.

const MovieCard: React.FC<MovieCardProps> = ({ pelicula, showEstrenoLabel = false, showPreventaLabel = false }) => {
	const navigate = useNavigate();
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

			<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50">
				<div className="flex flex-col items-center gap-3">
                    <button
						className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white w-40 justify-center transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:brightness-110"
						style={{ background: 'var(--cinepal-primary)' }}
					onClick={() => window.location.href = `/boletos?pelicula=${pelicula.id}`}
					>
						<ShoppingCart size={16} /> Comprar
					</button>
					<button
						className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white w-40 justify-center transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:brightness-110"
						style={{ background: 'var(--cinepal-primary-700)' }}
						onClick={() => navigate(`/detalle-pelicula?pelicula=${pelicula.id}`)}
					>
						<PlusCircle size={16} /> Ver detalles
					</button>
				</div>
			</div>
		</div>
	);
};

export default MovieCard;

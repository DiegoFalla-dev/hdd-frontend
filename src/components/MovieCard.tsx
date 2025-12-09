import React from 'react';
import { ShoppingCart, PlusCircle } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { COLORS } from '../styles/colors';

interface Pelicula {
	id: string;
	titulo: string;
	genero?: string;
	imagenCard?: string;
	status?: string;
}

interface MovieCardProps {
	pelicula: Pelicula;
	showEstrenoLabel?: boolean;
	showPreventaLabel?: boolean;
	showProximoLabel?: boolean;
	firstShowtimeDate?: string | null; // ISO date string del primer showtime
}

// MovieCard shows a single movie. Navigation to details uses the movie's id.

const MovieCard: React.FC<MovieCardProps> = ({ pelicula, showEstrenoLabel = false, showPreventaLabel = false, showProximoLabel = false, firstShowtimeDate = null }) => {
	const navigate = useNavigate();
	
	// Formatear fecha para mostrar en preventa (ejemplo: "10 Diciembre 2025")
	const formatPreventaDate = (isoDate: string | null) => {
		if (!isoDate) return null;
		try {
			// Parsear fecha directamente sin zona horaria para evitar problemas
			const [year, month, day] = isoDate.split('T')[0].split('-');
			const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
			return date.toLocaleDateString('es-ES', { 
				day: 'numeric', 
				month: 'long', 
				year: 'numeric' 
			});
		} catch {
			return null;
		}
	};
	
	const preventaDateFormatted = showPreventaLabel && firstShowtimeDate 
		? formatPreventaDate(firstShowtimeDate)
		: null;
	
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
			<span className="absolute left-0 top-2 -rotate-12 text-white px-4 py-1 text-base font-bold shadow-lg" style={{backgroundColor: COLORS.primary}}>Estreno</span>
		)}
		{showPreventaLabel && (
			<span className="absolute left-0 top-2 -rotate-12 text-white px-4 py-1 text-base font-bold shadow-lg" style={{backgroundColor: COLORS.primary}}>Pre-venta</span>
		)}
		
		{/* Mostrar fecha de preventa en hover si está disponible */}
		{showPreventaLabel && preventaDateFormatted && (
			<div className="absolute top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
				<p className="text-center font-bold text-lg text-white whitespace-nowrap">{preventaDateFormatted}</p>
			</div>
		)}
		
		{/* Mostrar "PRÓXIMAMENTE" en hover para películas próximas */}
		{showProximoLabel && (
			<div className="absolute top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
				<p className="text-center font-bold text-2xl text-white whitespace-nowrap">PRÓXIMAMENTE</p>
			</div>
		)}
		
		{!showProximoLabel && (
			<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 z-10">
				<div className="flex flex-col items-center gap-3">
					<button
						className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white w-40 justify-center transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:brightness-110"
						style={{ background: 'var(--cinepal-primary)' }}
						onClick={() => {
							const user = authService.getCurrentUser();
							const target = `/detalle-pelicula?pelicula=${pelicula.id}`;
							if (user) {
								navigate(target);
								return;
							}
							// If not logged, open login modal and redirect after successful login
							window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { from: 'detalle-redirect', redirectTo: target } }));
							const onLogin = () => {
								navigate(target);
								window.removeEventListener('auth:login', onLogin);
							};
							window.addEventListener('auth:login', onLogin);
						}}
					>
						<ShoppingCart size={16} /> Comprar
					</button>
					<button
						className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white w-40 justify-center transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:brightness-110"
						style={{ background: 'var(--cinepal-primary-700)' }}
						onClick={() => {
							const user = authService.getCurrentUser();
							const target = `/detalle-pelicula?pelicula=${pelicula.id}`;
							if (user) {
								navigate(target);
								return;
							}
							// If not logged, open login modal and redirect after successful login
							window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { from: 'detalle-redirect', redirectTo: target } }));
							const onLogin = () => {
								navigate(target);
								window.removeEventListener('auth:login', onLogin);
							};
							window.addEventListener('auth:login', onLogin);
						}}
					>
						<PlusCircle size={16} /> Ver detalles
					</button>
				</div>
			</div>
		)}
		
		{showProximoLabel && (
			<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 z-10">
				<div className="flex flex-col items-center gap-3">
					<button
						className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white w-40 justify-center transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:brightness-110"
						style={{ background: 'var(--cinepal-primary-700)' }}
						onClick={() => {
							const user = authService.getCurrentUser();
							const target = `/detalle-pelicula?pelicula=${pelicula.id}`;
							if (user) {
								navigate(target);
								return;
							}
							// If not logged, open login modal and redirect after successful login
							window.dispatchEvent(new CustomEvent('openProfileModal', { detail: { from: 'detalle-redirect', redirectTo: target } }));
							const onLogin = () => {
								navigate(target);
								window.removeEventListener('auth:login', onLogin);
							};
							window.addEventListener('auth:login', onLogin);
						}}
					>
						<PlusCircle size={16} /> Ver detalles
					</button>
				</div>
			</div>
		)}
		</div>
	);
};

export default MovieCard;

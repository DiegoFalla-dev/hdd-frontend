import React, { useState } from 'react';
import { ChevronDown } from 'react-feather';

interface FilterDropdownProps {
	options: string[];
	selectedOption: string;
	onSelect: (option: string) => void;
	placeholder: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ options, selectedOption, onSelect, placeholder }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-between w-full px-3 py-2 text-left text-sm font-medium transition-colors border"
				style={{ background: 'transparent', color: 'var(--cineplus-gray-light)', borderColor: 'var(--cineplus-gray)' }}
			>
				<span>{selectedOption || placeholder}</span>
				<ChevronDown size={14} className={`${isOpen ? 'rotate-180' : ''}`} />
			</button>

			{isOpen && (
				<div className="mt-2 absolute left-0 right-0 bg-transparent z-10">
					{options.map((option) => (
						<button
							key={option}
							onClick={() => { onSelect(option); setIsOpen(false); }}
							className="w-full text-left px-6 py-2 text-sm"
							style={{ color: selectedOption === option ? 'var(--cineplus-gray-light)' : 'var(--cineplus-gray)', backgroundColor: selectedOption === option ? 'var(--cineplus-gray-dark)' : 'transparent' }}
						>
							{option}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default FilterDropdown;

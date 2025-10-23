import React from 'react';
import './SideModal.css'; // Asegúrate de tener este archivo CSS para los estilos del diseño.

interface SideModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const SideModal: React.FC<SideModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="side-modal-overlay">
            <div className="side-modal-backdrop" onClick={onClose}></div>
            
            <div className="side-modal-container">
                <div className="side-modal-header">
                    <h2 className="side-modal-title">{title}</h2>
                    {/* Elementos de diseño adicionales */}
                    <p className="side-modal-subtitle">Selecciona tu cine favorito</p>
                    <p className="side-modal-order">Ordenado alfabéticamente</p>
                    <button className="side-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                
                <div className="side-modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SideModal;
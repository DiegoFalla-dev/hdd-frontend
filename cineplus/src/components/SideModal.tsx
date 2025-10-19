import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

const SideModal: React.FC<SideModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = "w-96" 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ backdropFilter: "blur(4px)" }}>
      {/* Invisible overlay for closing */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Side panel */}
      <div 
        className={`fixed top-0 right-0 h-full ${width} shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          background: "var(--cineplus-black)", 
          border: "1px solid var(--cineplus-gray-dark)",
          borderRight: "none"
        }}
      >
        <div className="p-6 h-full overflow-y-auto">
          {title && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "var(--cineplus-gray-light)" }}>
                {title}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default SideModal;
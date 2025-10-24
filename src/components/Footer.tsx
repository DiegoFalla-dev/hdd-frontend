import React from "react";
import { FaFacebookF, FaXTwitter, FaInstagram, FaYoutube } from "react-icons/fa6";

const Footer: React.FC = () => (
  <footer style={{ background: "var(--cineplus-black)", color: "var(--cineplus-gray-light)" }}>
  <div style={{ borderTop: "4px solid var(--cineplus-gray)" }}></div>
  <div style={{ background: "var(--cineplus-gray-light)", color: "var(--cineplus-black)", fontSize: 14, padding: '16px 0' }}>
  <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          Cineplus S.A<br />
          Todos los derechos reservados 2025
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: "var(--cineplus-gray-dark)" }}>Síguenos en</span>
          <span className="hidden md:inline" style={{ color: "var(--cineplus-gray-medium)" }}>|</span>
          <a
            href="#"
            className="mx-1 social-icon social-facebook"
            aria-label="Facebook"
            style={{ color: "var(--cineplus-gray-dark)" }}
          >
            <FaFacebookF size={20} />
          </a>
          <a
            href="#"
            className="mx-1 social-icon social-x"
            aria-label="X (Twitter)"
            style={{ color: "var(--cineplus-gray-dark)" }}
          >
            <FaXTwitter size={20} />
          </a>
          <a
            href="#"
            className="mx-1 social-icon social-instagram"
            aria-label="Instagram"
            style={{ color: "var(--cineplus-gray-dark)" }}
          >
            <FaInstagram size={20} />
          </a>
          <a
            href="#"
            className="mx-1 social-icon social-youtube"
            aria-label="YouTube"
            style={{ color: "var(--cineplus-gray-dark)" }}
          >
            <FaYoutube size={20} />
          </a>

        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

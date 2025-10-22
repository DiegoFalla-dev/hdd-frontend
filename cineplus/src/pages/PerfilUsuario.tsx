import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const PerfilUsuario: React.FC = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("historial"); // pestañas del perfil

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    fechaNacimiento: "",
    celular: "",
    genero: "",
    contraseña: "",
    confirmarContraseña: "",
    avatar: "",
  });

  const [compras, setCompras] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState({
    tipo: "tarjeta", // tarjeta | yape | plin
    tarjeta: "",
    titular: "",
    vencimiento: "",
    celular: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLogged(true);
    }

    const storedCompras = localStorage.getItem("compras");
    if (storedCompras) setCompras(JSON.parse(storedCompras));

    const storedPago = localStorage.getItem("metodoPago");
    if (storedPago) setMetodoPago(JSON.parse(storedPago));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = () => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (
        userData.correo === formData.correo &&
        userData.contraseña === formData.contraseña
      ) {
        setIsLogged(true);
        setUser(userData);
        alert(`Bienvenido, ${userData.nombre}!`);
        window.location.href = "/";
      } else {
        alert("Correo o contraseña incorrectos");
      }
    } else {
      alert("No hay ninguna cuenta registrada con ese correo.");
    }
  };

  const handleRegister = () => {
    if (
      formData.nombre &&
      formData.apellido &&
      formData.correo &&
      formData.fechaNacimiento &&
      formData.celular &&
      formData.genero &&
      formData.contraseña === formData.confirmarContraseña
    ) {
      localStorage.setItem("usuario", JSON.stringify(formData));
      alert("Cuenta creada con éxito 🎉");
      setIsRegistering(false);
    } else {
      alert("Verifica que todos los campos estén completos y correctos.");
    }
  };

  const handleLogout = () => {
    setIsLogged(false);
    setUser(null);
    localStorage.removeItem("usuario");
  };

  const agregarCompraMock = () => {
    const nuevaCompra = {
      id: compras.length + 1,
      pelicula: "Avengers: Endgame",
      fecha: new Date().toLocaleDateString(),
      hora: "19:30",
      total: "25.00",
    };
    const updatedCompras = [...compras, nuevaCompra];
    setCompras(updatedCompras);
    localStorage.setItem("compras", JSON.stringify(updatedCompras));
  };

  const generarQR = (texto: string) => {
    const tamaño = 150;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = tamaño;
    canvas.height = tamaño;
    const binario = Array.from(texto)
      .map((c) => c.charCodeAt(0).toString(2))
      .join("");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, tamaño, tamaño);
    ctx.fillStyle = "#000";
    for (let i = 0; i < binario.length; i++) {
      if (binario[i] === "1") {
        const x = (i * 5) % tamaño;
        const y = Math.floor((i * 5) / tamaño) * 5;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    return canvas.toDataURL("image/png");
  };

  const descargarTicket = (compra: any) => {
    const codigoQR = `CinePlus-${compra.id}-${compra.pelicula}-${compra.fecha}-${compra.hora}`;
    const qrData = generarQR(codigoQR);

    const ventana = window.open("", "_blank");
    if (ventana) {
      ventana.document.write(`
        <html>
          <head><title>Ticket #${compra.id}</title></head>
          <body style="font-family: Arial; text-align: center;">
            <div style="border: 2px solid #000; padding: 20px; width: 320px; margin: 40px auto; border-radius: 10px;">
              <h2>🎬 CinePlus</h2>
              <h3>Ticket de Entrada</h3>
              <p><strong>Película:</strong> ${compra.pelicula}</p>
              <p><strong>Fecha:</strong> ${compra.fecha}</p>
              <p><strong>Hora:</strong> ${compra.hora}</p>
              <p><strong>Total:</strong> S/${compra.total}</p>
              <img src="${qrData}" width="150" height="150" alt="QR"/>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      ventana.document.close();
    }
  };

  const guardarMetodoPago = () => {
    if (metodoPago.tipo === "tarjeta") {
      if (metodoPago.tarjeta && metodoPago.titular && metodoPago.vencimiento) {
        localStorage.setItem("metodoPago", JSON.stringify(metodoPago));
        alert("Tarjeta guardada correctamente 💳");
      } else alert("Completa todos los campos de la tarjeta.");
    } else {
      if (metodoPago.celular) {
        localStorage.setItem("metodoPago", JSON.stringify(metodoPago));
        alert(`${metodoPago.tipo.toUpperCase()} guardado correctamente 📱`);
      } else alert("Ingresa tu número de celular.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl shadow-lg">
        {!isLogged ? (
          <>
            {!isRegistering ? (
              <>
                <h1 className="text-2xl font-bold text-center mb-6">
                  ¡HOLA! QUÉ BUENO VERTE POR ACÁ 🍿
                </h1>
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo electrónico"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="password"
                  name="contraseña"
                  placeholder="Contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-white text-black font-semibold rounded-md mb-3 hover:bg-gray-200 transition"
                >
                  INICIAR SESIÓN
                </button>
                <button
                  onClick={() => setIsRegistering(true)}
                  className="w-full py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
                >
                  CREAR CUENTA
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-center mb-6">
                  Crear cuenta 🎟️
                </h1>

                <div className="flex flex-col items-center mb-4">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full mb-3 border-2 border-white object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-700 mb-3 flex items-center justify-center text-gray-400 text-sm">
                      Sin foto
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-sm"
                  />
                </div>

                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo electrónico"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="tel"
                  name="celular"
                  placeholder="Celular"
                  value={formData.celular}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                >
                  <option value="">Selecciona tu género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                <input
                  type="password"
                  name="contraseña"
                  placeholder="Contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <input
                  type="password"
                  name="confirmarContraseña"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmarContraseña}
                  onChange={handleChange}
                  className="w-full p-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-md"
                />
                <button
                  onClick={handleRegister}
                  className="w-full py-3 bg-white text-black font-semibold rounded-md mb-3 hover:bg-gray-200 transition"
                >
                  VALIDAR CUENTA
                </button>
                <button
                  onClick={() => setIsRegistering(false)}
                  className="w-full py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition"
                >
                  Volver al inicio
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <img
                src={user?.avatar || "https://via.placeholder.com/80"}
                alt="Avatar"
                className="w-20 h-20 rounded-full mb-3 border-2 border-white object-cover"
              />
              <h1 className="text-2xl font-bold text-center">
                Bienvenido, {user?.nombre} 👋
              </h1>
            </div>

            <div className="flex justify-around mb-6 text-sm">
              <button
                onClick={() => setActiveTab("historial")}
                className={`px-3 py-1 rounded-md ${
                  activeTab === "historial" ? "bg-red-600" : "bg-zinc-800"
                }`}
              >
                Historial
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-3 py-1 rounded-md ${
                  activeTab === "tickets" ? "bg-red-600" : "bg-zinc-800"
                }`}
              >
                Tickets
              </button>
              <button
                onClick={() => setActiveTab("pago")}
                className={`px-3 py-1 rounded-md ${
                  activeTab === "pago" ? "bg-red-600" : "bg-zinc-800"
                }`}
              >
                Pago
              </button>
            </div>

            {activeTab === "historial" && (
              <div>
                <h2 className="text-lg mb-2 font-semibold">Historial de compras</h2>
                <button
                  onClick={agregarCompraMock}
                  className="w-full py-2 bg-white text-black font-semibold rounded-md mb-3 hover:bg-gray-200 transition"
                >
                  Simular compra 🎬
                </button>
                {compras.length === 0 ? (
                  <p className="text-gray-400 text-center">
                    No tienes compras registradas.
                  </p>
                ) : (
                  compras.map((c) => (
                    <div
                      key={c.id}
                      className="bg-zinc-800 p-3 rounded-md mb-2 text-sm"
                    >
                      <p>🎞️ {c.pelicula}</p>
                      <p>📅 {c.fecha}</p>
                      <p>🕒 {c.hora}</p>
                      <p>💰 S/{c.total}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "tickets" && (
              <div>
                <h2 className="text-lg mb-4 font-semibold">Descargar tickets 🎟️</h2>
                {compras.length === 0 ? (
                  <p className="text-gray-400 text-center">
                    No hay tickets disponibles.
                  </p>
                ) : (
                  compras.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => descargarTicket(c)}
                      className="w-full py-2 bg-red-600 rounded-md mb-2 hover:bg-red-700 transition"
                    >
                      Descargar ticket #{c.id}
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === "pago" && (
              <div>
                <h2 className="text-lg mb-4 font-semibold">
                  Configurar método de pago 💳
                </h2>
                
                <div className="flex justify-around mb-3">
                  <button
                    onClick={() => setMetodoPago({ ...metodoPago, tipo: "tarjeta" })}
                    className={`px-3 py-1 rounded-md ${
                      metodoPago.tipo === "tarjeta" ? "bg-red-600" : "bg-zinc-800"
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    onClick={() => setMetodoPago({ ...metodoPago, tipo: "yape" })}
                    className={`px-3 py-1 rounded-md ${
                      metodoPago.tipo === "yape" ? "bg-red-600" : "bg-zinc-800"
                    }`}
                  >
                    Yape
                  </button>
                  <button
                    onClick={() => setMetodoPago({ ...metodoPago, tipo: "plin" })}
                    className={`px-3 py-1 rounded-md ${
                      metodoPago.tipo === "plin" ? "bg-red-600" : "bg-zinc-800"
                    }`}
                  >
                    Plin
                  </button>
                </div>

                {metodoPago.tipo === "tarjeta" && (
                  <>
                    <input
                      type="text"
                      placeholder="Número de tarjeta"
                      value={metodoPago.tarjeta}
                      onChange={(e) =>
                        setMetodoPago({ ...metodoPago, tarjeta: e.target.value })
                      }
                      className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Titular de la tarjeta"
                      value={metodoPago.titular}
                      onChange={(e) =>
                        setMetodoPago({ ...metodoPago, titular: e.target.value })
                      }
                      className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                    />
                    <input
                      type="month"
                      placeholder="Vencimiento"
                      value={metodoPago.vencimiento}
                      onChange={(e) =>
                        setMetodoPago({ ...metodoPago, vencimiento: e.target.value })
                      }
                      className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                    />
                  </>
                )}

                {(metodoPago.tipo === "yape" || metodoPago.tipo === "plin") && (
                  <input
                    type="tel"
                    placeholder="Número de celular"
                    value={metodoPago.celular}
                    onChange={(e) =>
                      setMetodoPago({ ...metodoPago, celular: e.target.value })
                    }
                    className="w-full p-3 mb-3 bg-zinc-800 border border-zinc-700 rounded-md"
                  />
                )}

                <button
                  onClick={guardarMetodoPago}
                  className="w-full py-2 bg-white text-black rounded-md hover:bg-gray-200 transition"
                >
                  Guardar método
                </button>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-3 mt-6 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;
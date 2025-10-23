import React, { useState, useEffect } from 'react';
import userAuthService from '../services/userAuthService';
import type { UserInfo, UpdateUserRequest } from '../services/userAuthService';

interface CuentaPanelProps {
    onClose?: () => void;
}

const CuentaPanel: React.FC<CuentaPanelProps> = ({ onClose }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [form, setForm] = useState<UpdateUserRequest>({});

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const data = await userAuthService.getCurrentUser();
            setUser(data);
            // Initialize form with current values
            setForm({
                birthDate: data.birthDate,
                gender: data.gender,
                nationalId: data.nationalId,
                avatar: data.avatar
            });
        } catch (err) {
            console.error('Error loading user:', err);
            const e = err as unknown;
            // If unauthorized, clear session and redirect to home/login
            if (typeof e === 'object' && e !== null && 'response' in e) {
                const resp = (e as Record<string, unknown>)['response'] as Record<string, unknown> | undefined;
                if (resp && typeof resp['status'] === 'number' && resp['status'] === 401) {
                    setMessage({ text: 'Sesión expirada. Serás redirigido al inicio en 5 segundos.', type: 'error' });
                    // clear stored auth and redirect after a short delay to allow user to read the message
                    userAuthService.logout();
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 5000);
                    return;
                }
            }
            
            setMessage({ text: 'Error al cargar datos. Intenta nuevamente.', type: 'error' });
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            setMessage({ text: 'Solo se permiten imágenes JPG o PNG', type: 'error' });
            return;
        }

        // Validate dimensions
        const isValid = await userAuthService.validateAvatar(file);
        if (!isValid) {
            setMessage({ text: 'La imagen debe ser de 600x400 pixels', type: 'error' });
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(prev => ({ ...prev, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        try {
            await userAuthService.updateUser(user.id, form);
            setMessage({ text: 'Datos actualizados exitosamente', type: 'success' });
            await loadUser(); // Reload user data
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating user:', err);
            const error = err as Error;
            setMessage({ 
                text: error.message || 'Error al actualizar datos',
                type: 'error'
            });
        }
    };

    if (isLoading) return <div className="p-6 text-center">Cargando...</div>;

    if (!user && !isLoading) {
        return (
            <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Mi Cuenta</h2>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                    )}
                </div>
                <div className="p-4 bg-red-900 rounded text-red-100">
                    <p>No se pudieron cargar tus datos.</p>
                    {message && <p className="mt-2">{message.text}</p>}
                    <div className="mt-4 flex gap-3">
                        <button onClick={loadUser} className="px-4 py-2 bg-blue-600 text-white rounded">Reintentar</button>
                        {onClose && (
                            <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded">Cerrar</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Mi Cuenta</h2>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Non-editable fields */}
                <div>
                    <label className="block text-sm text-gray-400">Nombre</label>
                    <div className="mt-1 p-2 bg-gray-800 rounded">{user?.firstName}</div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400">Apellido</label>
                    <div className="mt-1 p-2 bg-gray-800 rounded">{user?.lastName}</div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400">Correo</label>
                    <div className="mt-1 p-2 bg-gray-800 rounded">{user?.email}</div>
                </div>

                {/* Editable fields */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400">Fecha de nacimiento</label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={form.birthDate || ''}
                                onChange={e => setForm(prev => ({ ...prev, birthDate: e.target.value }))}
                                className="mt-1 p-2 w-full bg-gray-800 rounded"
                                disabled={!isEditing}
                            />
                        ) : (
                            <div className="mt-1 p-2 bg-gray-800 rounded">{form.birthDate}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400">Género</label>
                        {isEditing ? (
                            <select
                                value={form.gender || ''}
                                onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as 'Masculino' | 'Femenino' }))}
                                className="mt-1 p-2 w-full bg-gray-800 rounded"
                                disabled={!isEditing}
                            >
                                <option value="">Seleccionar</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                            </select>
                        ) : (
                            <div className="mt-1 p-2 bg-gray-800 rounded">{form.gender}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400">DNI</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={form.nationalId || ''}
                                onChange={e => setForm(prev => ({ ...prev, nationalId: e.target.value }))}
                                maxLength={8}
                                pattern="\d{1,8}"
                                className="mt-1 p-2 w-full bg-gray-800 rounded"
                                disabled={!isEditing}
                            />
                        ) : (
                            <div className="mt-1 p-2 bg-gray-800 rounded">{form.nationalId}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400">Avatar</label>
                        {user?.avatar && (
                            <img 
                                src={user?.avatar} 
                                alt="Avatar" 
                                className="mt-2 w-[300px] h-[200px] object-cover rounded"
                            />
                        )}
                        {isEditing && (
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleFileChange}
                                className="mt-2 p-2 w-full bg-gray-800 rounded"
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        {!isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Actualizar datos
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Guardar cambios
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        loadUser(); // Reset form
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded ${
                        message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CuentaPanel;
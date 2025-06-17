import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { User, Lock, Bell, Globe, Palette, Download, Upload, Save, Camera } from 'lucide-react';
import { supabase, shouldUseMockData } from '../../lib/supabase';
import { uploadToImgBB } from '../../lib/imgbb';

export const UserSettings: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { transactions, categories, budgets, accounts, goals } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    budgetAlerts: true,
    transactionReminders: false,
    monthlyReports: true
  });
  const [preferences, setPreferences] = useState({
    currency: profile?.currency || 'MXN',
    language: 'es',
    theme: localStorage.getItem('theme') || 'light',
    dateFormat: 'dd/MM/yyyy'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name,
        avatar_url: profile.avatar_url || ''
      });
      setPreferences(prev => ({
        ...prev,
        currency: profile.currency
      }));
    }
  }, [profile]);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    // { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'preferences', label: 'Preferencias', icon: Globe },
    { id: 'data', label: 'Datos', icon: Download }
  ];

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      if (shouldUseMockData()) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageUrl = e.target?.result as string;
          setProfileData(prev => ({ ...prev, avatar_url: imageUrl }));
          await updateProfile({ avatar_url: imageUrl });
          alert('Foto de perfil actualizada correctamente');
        };
        reader.readAsDataURL(file);
      } else {
        const imageUrl = await uploadToImgBB(file);
        setProfileData(prev => ({ ...prev, avatar_url: imageUrl }));
        await updateProfile({ avatar_url: imageUrl });
        alert('Foto de perfil actualizada correctamente');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(`Error al subir la foto: ${error.message || 'Error desconocido'}. Inténtalo de nuevo.`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener tu información de usuario'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    try {
      const { value: isConfirmed } = await Swal.fire({
        title: 'Confirmar cambio de contraseña',
        text: '¿Estás seguro de que quieres cambiar tu contraseña?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar contraseña',
        cancelButtonText: 'Cancelar'
      });

      if (!isConfirmed) return;

      // Primero reautenticar al usuario con su contraseña actual
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (authError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Luego actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Contraseña actualizada correctamente',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        navigate('/dashboard');
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error desconocido'
      });
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ currency: preferences.currency });
      applyTheme(preferences.theme);
      localStorage.setItem('theme', preferences.theme);
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      alert('Preferencias actualizadas correctamente');
    } catch (error) {
      alert('Error al actualizar las preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937';
      document.body.style.color = '#f9fafb';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f9fafb';
      document.body.style.color = '#111827';
    }
  };

  const exportData = () => {
    try {
      const exportData = {
        user: {
          id: user?.id,
          name: profile?.name,
          email: user?.email
        },
        profile: profile,
        transactions: transactions,
        categories: categories,
        budgets: budgets,
        accounts: accounts,
        goals: goals,
        preferences: preferences,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financeapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Datos exportados correctamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.transactions || !data.categories || !data.accounts) {
            alert('Archivo de respaldo inválido');
            return;
          }
          
          if (shouldUseMockData()) {
            if (data.transactions) localStorage.setItem('transactions', JSON.stringify(data.transactions));
            if (data.budgets) localStorage.setItem('budgets', JSON.stringify(data.budgets));
            if (data.accounts) localStorage.setItem('accounts', JSON.stringify(data.accounts));
            if (data.categories) localStorage.setItem('categories', JSON.stringify(data.categories));
            if (data.goals) localStorage.setItem('goals', JSON.stringify(data.goals));
            if (data.preferences) localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
          }
          
          alert('Datos importados correctamente. La página se recargará.');
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Error al importar los datos. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const sendTestEmail = async () => {
    try {
      if (shouldUseMockData()) {
        alert('Función de correo no disponible en modo demo. Conecta Supabase para funcionalidad completa.');
        return;
      }
  
      setIsSaving(true);
      
      const emailData = {
        to: user?.email || '',
        subject: 'Correo de Prueba - FinanceApp',
        html: `
          <h2>¡Hola ${profile?.name}!</h2>
          <p>Este es un correo de prueba desde FinanceApp.</p>
          <p>Si recibes este mensaje, las notificaciones por correo están funcionando correctamente.</p>
          <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
          <br>
          <p>Saludos,<br>El equipo de FinanceApp</p>
        `,
        type: 'test'
      };
  
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido al enviar el correo');
      }
  
      if (result.success) {
        alert(`Correo de prueba enviado correctamente a ${user?.email}. Revisa tu bandeja de entrada y carpeta de spam.`);
      } else {
        throw new Error(result.error || 'El servidor no pudo enviar el correo');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      
      let errorMessage = 'Error al enviar correo de prueba. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else {
          errorMessage += `Detalles: ${error.message}`;
        }
      } else {
        errorMessage += 'Error desconocido. Por favor, revisa la consola del navegador para más detalles.';
      }
      
      errorMessage += '\n\nPor favor, verifica:';
      errorMessage += '\n1. Que el correo electrónico de tu perfil sea válido';
      errorMessage += '\n2. Que la función de correo esté configurada correctamente en Supabase';
      errorMessage += '\n3. Que no haya errores en la consola del navegador (F12)';
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    const updatedNotifications = { ...notifications, [key]: value };
    localStorage.setItem('notificationPreferences', JSON.stringify(updatedNotifications));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-600 mt-1">Personaliza tu experiencia en FinanceApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Información del Perfil</h3>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={profileData.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{uploadingPhoto ? 'Subiendo...' : 'Cambiar Foto'}</span>
                      </button>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG hasta 2MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Seguridad</h3>
                
                {shouldUseMockData() && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">
                      <strong>Modo Demo:</strong> El cambio de contraseña no está disponible. Conecta Supabase para funcionalidad completa.
                    </p>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      disabled={shouldUseMockData()}
                      required={!shouldUseMockData()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      disabled={shouldUseMockData()}
                      required={!shouldUseMockData()}
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={shouldUseMockData()}
                      required={!shouldUseMockData()}
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || shouldUseMockData()}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h3>
                
                <div className="space-y-6">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {key === 'emailNotifications' && 'Notificaciones por Email'}
                          {key === 'budgetAlerts' && 'Alertas de Presupuesto'}
                          {key === 'transactionReminders' && 'Recordatorios de Transacciones'}
                          {key === 'monthlyReports' && 'Reportes Mensuales'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {key === 'emailNotifications' && 'Recibe notificaciones importantes por correo'}
                          {key === 'budgetAlerts' && 'Alertas cuando excedas tu presupuesto'}
                          {key === 'transactionReminders' && 'Recordatorios para registrar gastos'}
                          {key === 'monthlyReports' && 'Resumen mensual de tus finanzas'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNotificationChange(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={sendTestEmail}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Enviar Correo de Prueba</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferencias</h3>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Fecha
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Preferencias'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Gestión de Datos</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Exportar Datos</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Descarga una copia completa de todos tus datos financieros en formato JSON.
                      Incluye transacciones, categorías, cuentas, presupuestos y configuraciones.
                    </p>
                    <button
                      onClick={exportData}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar Datos</span>
                    </button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Importar Datos</h4>
                    <p className="text-sm text-green-700 mb-4">
                      Restaura tus datos desde un archivo de respaldo previamente exportado.
                      Esto sobrescribirá todos los datos actuales.
                    </p>
                    <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Importar Datos</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Estadísticas de Datos</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Transacciones:</span>
                        <span className="font-semibold ml-2">{transactions.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Categorías:</span>
                        <span className="font-semibold ml-2">{categories.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cuentas:</span>
                        <span className="font-semibold ml-2">{accounts.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Presupuestos:</span>
                        <span className="font-semibold ml-2">{budgets.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">Eliminar Cuenta</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
                      Esta acción no se puede deshacer.
                    </p>
                    <button 
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                          alert('Funcionalidad de eliminación de cuenta en desarrollo');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
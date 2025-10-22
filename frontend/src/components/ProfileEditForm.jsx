import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { 
  User, MapPin, Globe, Twitter, Github, Linkedin, 
  Save, X, Edit3, Camera, Upload, Check
} from 'lucide-react';
import './ProfileEditForm.css';

const ProfileEditForm = ({ onClose, onSave }) => {
  const { address } = useWallet();
  const { 
    profile, 
    isLoading, 
    error, 
    createProfile, 
    updateProfile, 
    getDefaultProfile,
    calculateCompleteness 
  } = useProfile();

  const [formData, setFormData] = useState(getDefaultProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
        twitter_handle: profile.twitter_handle || '',
        github_handle: profile.github_handle || '',
        linkedin_handle: profile.linkedin_handle || '',
        preferences: profile.preferences || { theme: 'dark', language: 'es', notifications: true },
        settings: profile.settings || { privacy_level: 'public', show_earnings: true, show_skills: true }
      });
      setIsEditing(false);
    } else {
      setFormData(getDefaultProfile());
      setIsEditing(true);
    }
  }, [profile]);

  const handleInputChange = (field, value) => {
    if (field === 'avatar_url') {
      console.log('🔄 avatar_url changing:', {
        from: formData.avatar_url ? `${Math.round(formData.avatar_url.length / 1024)}KB` : 'empty',
        to: value ? `${Math.round(value.length / 1024)}KB` : 'empty',
        isBase64: value ? value.startsWith('data:') : false
      });
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveError(null);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 500KB for reasonable base64 size)
      const maxSizeKB = 500;
      const maxSizeBytes = maxSizeKB * 1024;
      
      if (file.size > maxSizeBytes) {
        setSaveError(`La imagen es muy grande. Máximo ${maxSizeKB}KB. Tu imagen: ${Math.round(file.size / 1024)}KB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      console.log('📸 Uploading image:', {
        name: file.name,
        size: `${Math.round(file.size / 1024)}KB`,
        type: file.type
      });

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        handleInputChange('avatar_url', base64String);
        console.log('✅ Image converted to base64:', {
          originalSize: `${Math.round(file.size / 1024)}KB`,
          base64Size: `${Math.round(base64String.length / 1024)}KB`,
          format: base64String.substring(0, 30) + '...'
        });
      };
      reader.onerror = () => {
        console.error('❌ Error reading image file');
        setSaveError('Error al leer la imagen. Inténtalo de nuevo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!address) {
      setSaveError('Wallet not connected');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Clean up empty strings
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          typeof value === 'string' ? value.trim() : value
        ])
      );

      console.log('💾 Saving profile data:', {
        ...cleanData,
        avatar_url: cleanData.avatar_url ? 
          `[Base64 image: ${Math.round(cleanData.avatar_url.length / 1024)}KB]` : 
          'No avatar'
      });

      if (profile) {
        console.log('📝 Updating existing profile...');
        const result = await updateProfile(cleanData);
        console.log('✅ Profile updated:', result);
      } else {
        console.log('🆕 Creating new profile...');
        const result = await createProfile(cleanData);
        console.log('✅ Profile created:', result);
      }

      setIsEditing(false);
      onSave?.();

    } catch (err) {
      console.error('❌ Error saving profile:', err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
        twitter_handle: profile.twitter_handle || '',
        github_handle: profile.github_handle || '',
        linkedin_handle: profile.linkedin_handle || '',
        preferences: profile.preferences || { theme: 'dark', language: 'es', notifications: true },
        settings: profile.settings || { privacy_level: 'public', show_earnings: true, show_skills: true }
      });
      setIsEditing(false);
    } else {
      onClose?.();
    }
  };

  const completeness = calculateCompleteness(formData);

  if (isLoading) {
    return (
      <div className="profile-edit-form">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-form">
      <div className="form-header">
        <h2>
          <User size={24} />
          {profile ? 'Editar Perfil' : 'Crear Perfil'}
        </h2>
        <div className="completeness-bar">
          <div className="completeness-label">
            Completitud: {completeness}%
          </div>
          <div className="completeness-progress">
            <div 
              className="completeness-fill" 
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
        {/* Avatar Section */}
        <div className="form-section">
          <label className="section-label">
            <Camera size={20} />
            Foto de Perfil
          </label>
          <div className="avatar-upload">
            <div className="avatar-preview">
              {avatarPreview || formData.avatar_url ? (
                <img 
                  src={avatarPreview || formData.avatar_url} 
                  alt="Avatar preview"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="upload-controls">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="file-input"
              />
              <label htmlFor="avatar-upload" className="upload-btn">
                <Upload size={16} />
                Subir Imagen
              </label>
              {!avatarPreview && (
                <input
                  type="url"
                  placeholder="O pegar URL de imagen"
                  value={formData.avatar_url && !formData.avatar_url.startsWith('data:') ? formData.avatar_url : ''}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  className="url-input"
                />
              )}
              {avatarPreview && (
                <button 
                  type="button"
                  className="remove-btn"
                  onClick={() => {
                    setAvatarPreview(null);
                    handleInputChange('avatar_url', '');
                  }}
                >
                  <X size={16} />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="form-section">
          <label className="section-label">
            <Edit3 size={20} />
            Información Básica
          </label>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="display_name">Nombre de Usuario</label>
              <input
                type="text"
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Tu nombre público"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={16} />
                Ubicación
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ciudad, País"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="form-section">
          <label className="section-label">Biografía</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Cuéntanos sobre ti, tus habilidades y experiencia..."
            className="form-textarea"
            rows={4}
          />
        </div>

        {/* Social Links */}
        <div className="form-section">
          <label className="section-label">Enlaces Sociales</label>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="website">
                <Globe size={16} />
                Sitio Web
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://tu-sitio.com"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="twitter_handle">
                <Twitter size={16} />
                Twitter
              </label>
              <input
                type="text"
                id="twitter_handle"
                value={formData.twitter_handle}
                onChange={(e) => handleInputChange('twitter_handle', e.target.value)}
                placeholder="@tu_usuario"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="github_handle">
                <Github size={16} />
                GitHub
              </label>
              <input
                type="text"
                id="github_handle"
                value={formData.github_handle}
                onChange={(e) => handleInputChange('github_handle', e.target.value)}
                placeholder="tu_usuario"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="linkedin_handle">
                <Linkedin size={16} />
                LinkedIn
              </label>
              <input
                type="text"
                id="linkedin_handle"
                value={formData.linkedin_handle}
                onChange={(e) => handleInputChange('linkedin_handle', e.target.value)}
                placeholder="tu_usuario"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="form-section">
          <label className="section-label">Configuración de Privacidad</label>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="privacy_level">Nivel de Privacidad</label>
              <select
                id="privacy_level"
                value={formData.settings?.privacy_level || 'public'}
                onChange={(e) => handleInputChange('settings', {
                  ...formData.settings,
                  privacy_level: e.target.value
                })}
                className="form-select"
              >
                <option value="public">Público</option>
                <option value="friends">Solo Amigos</option>
                <option value="private">Privado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.settings?.show_earnings || false}
                  onChange={(e) => handleInputChange('settings', {
                    ...formData.settings,
                    show_earnings: e.target.checked
                  })}
                  className="form-checkbox"
                />
                Mostrar Ganancias
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="error-message">
            <p>{saveError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="spinner-small"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Perfil
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;

import React, { useState } from 'react';
import {
  PlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  GlobeAltIcon,
  UserGroupIcon,
  LockClosedIcon,
  SparklesIcon,
  BriefcaseIcon,
  TrophyIcon,
  LightBulbIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface PostCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: any) => void;
  userName: string;
}

const PostCreationForm: React.FC<PostCreationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName
}) => {
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<'post' | 'job' | 'event' | 'poll' | 'skill'>('post');
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const postTypes = [
    { id: 'post', name: 'Publicación', icon: DocumentTextIcon, description: 'Comparte actualizaciones y pensamientos' },
    { id: 'job', name: 'Oportunidad', icon: BriefcaseIcon, description: 'Publica trabajos o busca talento' },
    { id: 'event', name: 'Evento', icon: CalendarIcon, description: 'Anuncia conferencias y meetups' },
    { id: 'poll', name: 'Encuesta', icon: UserGroupIcon, description: 'Pregunta a la comunidad' },
    { id: 'skill', name: 'Habilidad', icon: LightBulbIcon, description: 'Muestra tus competencias' },
  ];

  const visibilityOptions = [
    { id: 'public', name: 'Público', icon: GlobeAltIcon, description: 'Visible para todos' },
    { id: 'connections', name: 'Conexiones', icon: UserGroupIcon, description: 'Solo tus conexiones' },
    { id: 'private', name: 'Privado', icon: LockClosedIcon, description: 'Solo tú' },
  ];

  const suggestedTags = [
    'Web3', 'DeFi', 'NFT', 'Blockchain', 'Smart Contracts', 'React', 'TypeScript',
    'JavaScript', 'Python', 'Solidity', 'Ethereum', 'Polygon', 'Arbitrum',
    'Frontend', 'Backend', 'Full Stack', 'UI/UX', 'Design', 'Marketing'
  ];

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const handleSubmit = () => {
    const postData = {
      content,
      type: selectedType,
      visibility,
      tags,
      scheduledDate: isScheduled ? scheduledDate : null,
      mediaFiles,
      isAnonymous
    };
    
    onSubmit(postData);
    // Reset form
    setContent('');
    setTags([]);
    setMediaFiles([]);
    setScheduledDate('');
    setIsScheduled(false);
    setIsAnonymous(false);
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-2xl rounded-xl bg-slate-800/95 border-cyan-500/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white" style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Crear Nueva Publicación
            </h3>
            <p className="text-sm text-cyan-300">
              Comparte con la comunidad de GigChain
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-500/20 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3">
              Tipo de publicación
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {postTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedType === type.id
                        ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/25'
                        : 'border-cyan-500/30 hover:border-cyan-400/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <TypeIcon className="h-5 w-5 text-cyan-400 mb-2" />
                    <div className="text-sm font-medium text-white">
                      {type.name}
                    </div>
                    <div className="text-xs text-cyan-300">
                      {type.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Content Input with Examples */}
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3">
              ¿Qué quieres compartir, {userName}?
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  selectedType === 'job' ? '🚀 Busco React Developer para proyecto DeFi\n💰 Presupuesto: $5,000 - $8,000\n⏰ Timeline: 4-6 semanas\n📋 Requisitos: TypeScript, Redux, D3.js\n#React #DeFi #Frontend' :
                  selectedType === 'event' ? '🎉 Conferencia Web3 2024\n📅 Fecha: 15-16 de Marzo\n📍 Ubicación: Madrid, España\n🎯 Temas: DeFi, NFT, Blockchain\n#Web3 #Conferencia #Madrid' :
                  selectedType === 'poll' ? '❓ ¿Cuál es tu framework favorito para DeFi?\nA) React\nB) Vue\nC) Angular\nD) Svelte\n#Poll #DeFi #Frontend' :
                  selectedType === 'skill' ? '💡 Acabo de completar mi certificación en Solidity\n🏆 50+ smart contracts auditados\n🔥 Experto en DeFi protocols\n#Solidity #SmartContracts #DeFi' :
                  '💭 Acabo de desplegar mi primer protocolo DeFi en Polygon...\n🚀 Las gas fees son increíblemente bajas\n✨ La experiencia de usuario es asombrosa\n#DeFi #Polygon #Web3'
                }
                className="w-full h-40 px-4 py-3 border border-cyan-500/30 rounded-xl bg-slate-700/50 text-white placeholder-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none backdrop-blur-sm"
              />
              <div className="absolute bottom-3 right-3 text-xs text-cyan-400">
                {content.length}/500
              </div>
            </div>
            
            {/* Content Examples */}
            <div className="mt-3">
              <p className="text-sm text-cyan-300 mb-2">💡 Ejemplos de {postTypes.find(t => t.id === selectedType)?.name}s exitosos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedType === 'job' && (
                  <>
                    <button
                      onClick={() => setContent('🚀 Busco Frontend Developer para plataforma NFT\n💰 Presupuesto: $3,000 - $5,000\n⏰ Timeline: 3-4 semanas\n📋 Requisitos: React, Web3.js, IPFS\n#NFT #Frontend #Web3')}
                      className="p-3 text-left bg-cyan-500/20 rounded-lg hover:bg-cyan-500/30 transition-colors duration-200 border border-cyan-500/30"
                    >
                      <div className="text-sm font-medium text-cyan-300">Oportunidad NFT</div>
                      <div className="text-xs text-cyan-400">Frontend Developer - $3k-5k</div>
                    </button>
                    <button
                      onClick={() => setContent('🔥 Busco Smart Contract Developer\n💰 Presupuesto: $8,000 - $12,000\n⏰ Timeline: 6-8 semanas\n📋 Requisitos: Solidity, Hardhat, DeFi\n#SmartContracts #DeFi #Solidity')}
                      className="p-3 text-left bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-colors duration-200 border border-green-500/30"
                    >
                      <div className="text-sm font-medium text-green-300">Oportunidad DeFi</div>
                      <div className="text-xs text-green-400">Smart Contracts - $8k-12k</div>
                    </button>
                  </>
                )}
                {selectedType === 'post' && (
                  <>
                    <button
                      onClick={() => setContent('🎉 ¡Logro desbloqueado! Completé mi primer protocolo DeFi\n🚀 Desplegado en Polygon con gas fees súper bajas\n💡 La comunidad está respondiendo increíblemente bien\n#DeFi #Polygon #Logro #Web3')}
                      className="p-3 text-left bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors duration-200 border border-purple-500/30"
                    >
                      <div className="text-sm font-medium text-purple-300">Logro Personal</div>
                      <div className="text-xs text-purple-400">Protocolo DeFi completado</div>
                    </button>
                    <button
                      onClick={() => setContent('💭 Reflexionando sobre el futuro de Web3...\n🔮 ¿Cómo será el desarrollo en 5 años?\n🤔 ¿Qué tecnologías emergerán?\n#Web3 #Futuro #Reflexión #Tecnología')}
                      className="p-3 text-left bg-orange-500/20 rounded-lg hover:bg-orange-500/30 transition-colors duration-200 border border-orange-500/30"
                    >
                      <div className="text-sm font-medium text-orange-300">Reflexión</div>
                      <div className="text-xs text-orange-400">Futuro de Web3</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3">
              Tags (opcional)
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(tagInput)}
                  placeholder="Agregar tag..."
                  className="flex-1 px-3 py-2 border border-cyan-500/30 rounded-lg bg-slate-700/50 text-white placeholder-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                  onClick={() => handleAddTag(tagInput)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
                >
                  Agregar
                </button>
              </div>

              {/* Suggested Tags */}
              <div>
                <p className="text-xs text-cyan-400 mb-2">Tags sugeridos:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-1 text-xs bg-slate-700/50 text-cyan-300 rounded-full hover:bg-slate-600/50 hover:text-cyan-200 transition-colors border border-cyan-500/20"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-3">
              Multimedia (opcional)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col items-center p-4 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/50 cursor-pointer transition-colors bg-slate-700/30 hover:bg-slate-600/30">
                <PhotoIcon className="h-6 w-6 text-cyan-400 mb-2" />
                <span className="text-sm text-cyan-300">Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <label className="flex flex-col items-center p-4 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/50 cursor-pointer transition-colors bg-slate-700/30 hover:bg-slate-600/30">
                <VideoCameraIcon className="h-6 w-6 text-cyan-400 mb-2" />
                <span className="text-sm text-cyan-300">Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <label className="flex flex-col items-center p-4 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/50 cursor-pointer transition-colors bg-slate-700/30 hover:bg-slate-600/30">
                <DocumentTextIcon className="h-6 w-6 text-cyan-400 mb-2" />
                <span className="text-sm text-cyan-300">Documento</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {mediaFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg border border-cyan-500/20">
                    <span className="text-sm text-cyan-300">{file.name}</span>
                    <button
                      onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility and Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Visibilidad
              </label>
              <div className="space-y-2">
                {visibilityOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <label key={option.id} className="flex items-center p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors duration-200">
                      <input
                        type="radio"
                        name="research-type"
                        value={option.id}
                        checked={visibility === option.id}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="mr-3 text-cyan-500 focus:ring-cyan-500"
                      />
                      <OptionIcon className="h-4 w-4 mr-2 text-cyan-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{option.name}</div>
                        <div className="text-xs text-cyan-300">{option.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Programación
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="mr-3 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-cyan-300">Programar publicación</span>
                </label>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-cyan-500/30 rounded-lg bg-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Preview Toggle and Anonymous Option */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="mr-3 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-cyan-300">Vista previa antes de publicar</span>
              </label>
              <div className="flex items-center text-sm text-cyan-400">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                Consejo: Usa tags relevantes para mayor visibilidad
              </div>
            </div>
            
            {/* Anonymous Option */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-cyan-500/20">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mr-3 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-cyan-300">Publicar como anónimo</span>
                    <p className="text-xs text-cyan-400 mt-1">
                      Tu nombre no será visible, pero tu reputación seguirá siendo privada
                    </p>
                  </div>
                </label>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-400">🔒 Privacidad</div>
                <div className="text-xs text-cyan-500">Protegido</div>
              </div>
            </div>
          </div>

          {/* Enhanced Preview */}
          {showPreview && content && (
            <div className="border border-cyan-500/20 rounded-lg p-4 bg-slate-700/30">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {isAnonymous ? '👤' : userName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {isAnonymous ? 'Usuario Anónimo' : userName}
                  </div>
                  <div className="text-sm text-cyan-300">
                    {isAnonymous && '🔒 '}Ahora
                  </div>
                </div>
              </div>
              <p className="text-white whitespace-pre-wrap">{content}</p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {isAnonymous && (
                <div className="mt-3 p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center text-xs text-cyan-300">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    Publicación anónima - Tu identidad está protegida
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-cyan-500/20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-cyan-300 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 hover:text-cyan-200 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
          >
            {isScheduled ? 'Programar' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCreationForm;

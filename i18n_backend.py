"""
GigChain.io - International

ization System (Backend)
Supports multiple languages for API responses and content.
"""

import json
import os
from typing import Dict, Any, Optional
from pathlib import Path
from enum import Enum

class Language(str, Enum):
    """Supported languages."""
    ENGLISH = "en"
    SPANISH = "es"
    PORTUGUESE = "pt"
    FRENCH = "fr"
    GERMAN = "de"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"

class TranslationManager:
    """
    Manages translations for the GigChain platform.
    Loads translations from JSON files and provides translation services.
    """
    
    def __init__(self, translations_dir: str = "translations"):
        self.translations_dir = Path(translations_dir)
        self.translations: Dict[str, Dict[str, Any]] = {}
        self.default_language = Language.ENGLISH
        self._load_all_translations()
    
    def _load_all_translations(self):
        """Load all translation files from the translations directory."""
        if not self.translations_dir.exists():
            self.translations_dir.mkdir(parents=True, exist_ok=True)
            self._create_default_translations()
        
        for lang_file in self.translations_dir.glob("*.json"):
            lang_code = lang_file.stem
            try:
                with open(lang_file, 'r', encoding='utf-8') as f:
                    self.translations[lang_code] = json.load(f)
            except Exception as e:
                print(f"Error loading translation file {lang_file}: {e}")
    
    def _create_default_translations(self):
        """Create default translation files if they don't exist."""
        default_translations = {
            Language.ENGLISH: self._get_english_translations(),
            Language.SPANISH: self._get_spanish_translations(),
            Language.PORTUGUESE: self._get_portuguese_translations(),
            Language.FRENCH: self._get_french_translations()
        }
        
        for lang, translations in default_translations.items():
            lang_file = self.translations_dir / f"{lang.value}.json"
            with open(lang_file, 'w', encoding='utf-8') as f:
                json.dump(translations, f, ensure_ascii=False, indent=2)
    
    def get(self, key: str, lang: Optional[str] = None, **kwargs) -> str:
        """
        Get translated text for a key.
        
        Args:
            key: Translation key in dot notation (e.g., "contract.created")
            lang: Language code (defaults to English)
            **kwargs: Variables to interpolate in the translation
        
        Returns:
            Translated text with interpolated variables
        """
        lang = lang or self.default_language.value
        
        # Get translation dict for language
        lang_dict = self.translations.get(lang, self.translations.get(self.default_language.value, {}))
        
        # Navigate through nested keys
        keys = key.split('.')
        value = lang_dict
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    # Fallback to English
                    value = self.translations.get(self.default_language.value, {})
                    for fallback_key in keys:
                        if isinstance(value, dict):
                            value = value.get(fallback_key)
                        else:
                            break
                    if not isinstance(value, str):
                        return key  # Return key if translation not found
                    break
            else:
                break
        
        if not isinstance(value, str):
            return key
        
        # Interpolate variables
        try:
            return value.format(**kwargs)
        except KeyError:
            return value
    
    def get_all(self, lang: Optional[str] = None) -> Dict[str, Any]:
        """Get all translations for a language."""
        lang = lang or self.default_language.value
        return self.translations.get(lang, {})
    
    def add_translation(self, lang: str, key: str, value: str):
        """Add or update a translation."""
        if lang not in self.translations:
            self.translations[lang] = {}
        
        keys = key.split('.')
        current = self.translations[lang]
        
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        
        current[keys[-1]] = value
        
        # Save to file
        lang_file = self.translations_dir / f"{lang}.json"
        with open(lang_file, 'w', encoding='utf-8') as f:
            json.dump(self.translations[lang], f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def _get_english_translations() -> Dict[str, Any]:
        """Get English translations."""
        return {
            "common": {
                "success": "Success",
                "error": "Error",
                "warning": "Warning",
                "info": "Information",
                "loading": "Loading...",
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "create": "Create",
                "update": "Update",
                "confirm": "Confirm",
                "back": "Back",
                "next": "Next",
                "finish": "Finish",
                "close": "Close"
            },
            "auth": {
                "challenge_requested": "Authentication challenge requested",
                "challenge_success": "Challenge generated successfully",
                "authentication_success": "Authentication successful",
                "authentication_failed": "Authentication failed",
                "invalid_signature": "Invalid signature",
                "session_expired": "Session expired",
                "session_refreshed": "Session refreshed",
                "logout_success": "Logged out successfully",
                "wallet_connected": "Wallet connected: {address}",
                "wallet_disconnected": "Wallet disconnected"
            },
            "contract": {
                "created": "Contract created successfully",
                "updated": "Contract updated successfully",
                "deleted": "Contract deleted successfully",
                "generation_started": "Contract generation started",
                "generation_complete": "Contract generation complete",
                "generation_failed": "Contract generation failed",
                "validation_success": "Contract validated successfully",
                "validation_failed": "Contract validation failed",
                "deployed": "Contract deployed to blockchain",
                "deployment_failed": "Contract deployment failed",
                "milestone_completed": "Milestone completed",
                "dispute_raised": "Dispute raised",
                "dispute_resolved": "Dispute resolved",
                "payment_released": "Payment released",
                "escrow_funded": "Escrow funded successfully"
            },
            "agent": {
                "negotiation": "Negotiation Agent",
                "contract_generator": "Contract Generator Agent",
                "quality": "Quality Assurance Agent",
                "payment": "Payment Agent",
                "dispute_resolver": "Dispute Resolver Agent",
                "processing": "Agent processing request...",
                "success": "Agent completed successfully",
                "error": "Agent encountered an error",
                "timeout": "Agent request timed out"
            },
            "gamification": {
                "xp_earned": "You earned {xp} XP!",
                "level_up": "Level up! You are now level {level}",
                "badge_earned": "Badge earned: {badge}",
                "trust_score_updated": "Trust score updated: {score}",
                "warning_issued": "Warning issued: {reason}",
                "user_banned": "User banned: {reason}",
                "visibility_boost": "Your visibility multiplier: {multiplier}x"
            },
            "chat": {
                "session_created": "Chat session created",
                "message_sent": "Message sent",
                "message_received": "Message received",
                "agent_switched": "Agent switched to {agent}",
                "history_loaded": "Chat history loaded",
                "error": "Chat error occurred"
            },
            "template": {
                "validated": "Template validated successfully",
                "validation_failed": "Template validation failed",
                "uploaded": "Template uploaded successfully",
                "upload_failed": "Template upload failed",
                "security_score": "Security score: {score}/100",
                "purchased": "Template purchased successfully",
                "listed": "Template listed on marketplace"
            },
            "analytics": {
                "dashboard": "Analytics Dashboard",
                "contracts_created": "Contracts Created",
                "total_volume": "Total Volume",
                "active_users": "Active Users",
                "success_rate": "Success Rate",
                "avg_completion_time": "Average Completion Time",
                "revenue": "Revenue",
                "growth": "Growth"
            },
            "nft": {
                "minted": "NFT minted successfully",
                "transferred": "NFT transferred",
                "reputation_updated": "Reputation NFT updated",
                "level_badge": "Level {level} Badge",
                "trust_badge": "Trust Score {score} Badge",
                "achievement_unlocked": "Achievement unlocked: {achievement}"
            },
            "oracle": {
                "dispute_submitted": "Dispute submitted to oracle",
                "oracle_deciding": "Oracle is deciding...",
                "resolution_complete": "Oracle resolution complete",
                "resolution_failed": "Oracle resolution failed",
                "evidence_submitted": "Evidence submitted",
                "voting_started": "Voting started",
                "voting_ended": "Voting ended"
            },
            "errors": {
                "internal_server": "Internal server error",
                "bad_request": "Bad request",
                "unauthorized": "Unauthorized",
                "forbidden": "Forbidden",
                "not_found": "Not found",
                "validation_error": "Validation error",
                "network_error": "Network error",
                "timeout": "Request timeout",
                "insufficient_funds": "Insufficient funds",
                "contract_not_found": "Contract not found",
                "user_not_found": "User not found",
                "agent_unavailable": "AI Agent unavailable"
            }
        }
    
    @staticmethod
    def _get_spanish_translations() -> Dict[str, Any]:
        """Get Spanish translations."""
        return {
            "common": {
                "success": "Éxito",
                "error": "Error",
                "warning": "Advertencia",
                "info": "Información",
                "loading": "Cargando...",
                "save": "Guardar",
                "cancel": "Cancelar",
                "delete": "Eliminar",
                "edit": "Editar",
                "create": "Crear",
                "update": "Actualizar",
                "confirm": "Confirmar",
                "back": "Atrás",
                "next": "Siguiente",
                "finish": "Finalizar",
                "close": "Cerrar"
            },
            "auth": {
                "challenge_requested": "Desafío de autenticación solicitado",
                "challenge_success": "Desafío generado exitosamente",
                "authentication_success": "Autenticación exitosa",
                "authentication_failed": "Autenticación fallida",
                "invalid_signature": "Firma inválida",
                "session_expired": "Sesión expirada",
                "session_refreshed": "Sesión renovada",
                "logout_success": "Sesión cerrada exitosamente",
                "wallet_connected": "Wallet conectada: {address}",
                "wallet_disconnected": "Wallet desconectada"
            },
            "contract": {
                "created": "Contrato creado exitosamente",
                "updated": "Contrato actualizado exitosamente",
                "deleted": "Contrato eliminado exitosamente",
                "generation_started": "Generación de contrato iniciada",
                "generation_complete": "Generación de contrato completada",
                "generation_failed": "Generación de contrato fallida",
                "validation_success": "Contrato validado exitosamente",
                "validation_failed": "Validación de contrato fallida",
                "deployed": "Contrato desplegado en blockchain",
                "deployment_failed": "Despliegue de contrato fallido",
                "milestone_completed": "Hito completado",
                "dispute_raised": "Disputa iniciada",
                "dispute_resolved": "Disputa resuelta",
                "payment_released": "Pago liberado",
                "escrow_funded": "Escrow financiado exitosamente"
            },
            "agent": {
                "negotiation": "Agente de Negociación",
                "contract_generator": "Agente Generador de Contratos",
                "quality": "Agente de Aseguramiento de Calidad",
                "payment": "Agente de Pagos",
                "dispute_resolver": "Agente Resolutor de Disputas",
                "processing": "Agente procesando solicitud...",
                "success": "Agente completado exitosamente",
                "error": "Agente encontró un error",
                "timeout": "Solicitud de agente expiró"
            },
            "gamification": {
                "xp_earned": "¡Ganaste {xp} XP!",
                "level_up": "¡Subiste de nivel! Ahora eres nivel {level}",
                "badge_earned": "Insignia ganada: {badge}",
                "trust_score_updated": "Puntuación de confianza actualizada: {score}",
                "warning_issued": "Advertencia emitida: {reason}",
                "user_banned": "Usuario baneado: {reason}",
                "visibility_boost": "Tu multiplicador de visibilidad: {multiplier}x"
            },
            "chat": {
                "session_created": "Sesión de chat creada",
                "message_sent": "Mensaje enviado",
                "message_received": "Mensaje recibido",
                "agent_switched": "Agente cambiado a {agent}",
                "history_loaded": "Historial de chat cargado",
                "error": "Error de chat ocurrido"
            },
            "template": {
                "validated": "Plantilla validada exitosamente",
                "validation_failed": "Validación de plantilla fallida",
                "uploaded": "Plantilla subida exitosamente",
                "upload_failed": "Subida de plantilla fallida",
                "security_score": "Puntuación de seguridad: {score}/100",
                "purchased": "Plantilla comprada exitosamente",
                "listed": "Plantilla listada en marketplace"
            },
            "analytics": {
                "dashboard": "Panel de Análisis",
                "contracts_created": "Contratos Creados",
                "total_volume": "Volumen Total",
                "active_users": "Usuarios Activos",
                "success_rate": "Tasa de Éxito",
                "avg_completion_time": "Tiempo Promedio de Completación",
                "revenue": "Ingresos",
                "growth": "Crecimiento"
            },
            "nft": {
                "minted": "NFT acuñado exitosamente",
                "transferred": "NFT transferido",
                "reputation_updated": "NFT de reputación actualizado",
                "level_badge": "Insignia Nivel {level}",
                "trust_badge": "Insignia Confianza {score}",
                "achievement_unlocked": "Logro desbloqueado: {achievement}"
            },
            "oracle": {
                "dispute_submitted": "Disputa enviada al oráculo",
                "oracle_deciding": "Oráculo decidiendo...",
                "resolution_complete": "Resolución del oráculo completada",
                "resolution_failed": "Resolución del oráculo fallida",
                "evidence_submitted": "Evidencia enviada",
                "voting_started": "Votación iniciada",
                "voting_ended": "Votación finalizada"
            },
            "errors": {
                "internal_server": "Error interno del servidor",
                "bad_request": "Solicitud incorrecta",
                "unauthorized": "No autorizado",
                "forbidden": "Prohibido",
                "not_found": "No encontrado",
                "validation_error": "Error de validación",
                "network_error": "Error de red",
                "timeout": "Tiempo de espera agotado",
                "insufficient_funds": "Fondos insuficientes",
                "contract_not_found": "Contrato no encontrado",
                "user_not_found": "Usuario no encontrado",
                "agent_unavailable": "Agente AI no disponible"
            }
        }
    
    @staticmethod
    def _get_portuguese_translations() -> Dict[str, Any]:
        """Get Portuguese translations."""
        return {
            "common": {
                "success": "Sucesso",
                "error": "Erro",
                "warning": "Aviso",
                "info": "Informação",
                "loading": "Carregando...",
                "save": "Salvar",
                "cancel": "Cancelar",
                "delete": "Excluir",
                "edit": "Editar",
                "create": "Criar",
                "update": "Atualizar",
                "confirm": "Confirmar",
                "back": "Voltar",
                "next": "Próximo",
                "finish": "Finalizar",
                "close": "Fechar"
            },
            "auth": {
                "challenge_requested": "Desafio de autenticação solicitado",
                "challenge_success": "Desafio gerado com sucesso",
                "authentication_success": "Autenticação bem-sucedida",
                "authentication_failed": "Falha na autenticação",
                "invalid_signature": "Assinatura inválida",
                "session_expired": "Sessão expirada",
                "session_refreshed": "Sessão renovada",
                "logout_success": "Logout bem-sucedido",
                "wallet_connected": "Carteira conectada: {address}",
                "wallet_disconnected": "Carteira desconectada"
            },
            "contract": {
                "created": "Contrato criado com sucesso",
                "updated": "Contrato atualizado com sucesso",
                "deleted": "Contrato excluído com sucesso",
                "generation_started": "Geração de contrato iniciada",
                "generation_complete": "Geração de contrato concluída",
                "generation_failed": "Falha na geração do contrato",
                "validation_success": "Contrato validado com sucesso",
                "validation_failed": "Falha na validação do contrato",
                "deployed": "Contrato implantado na blockchain",
                "deployment_failed": "Falha na implantação do contrato",
                "milestone_completed": "Marco concluído",
                "dispute_raised": "Disputa iniciada",
                "dispute_resolved": "Disputa resolvida",
                "payment_released": "Pagamento liberado",
                "escrow_funded": "Escrow financiado com sucesso"
            },
            "agent": {
                "negotiation": "Agente de Negociação",
                "contract_generator": "Agente Gerador de Contratos",
                "quality": "Agente de Garantia de Qualidade",
                "payment": "Agente de Pagamentos",
                "dispute_resolver": "Agente Resolutor de Disputas",
                "processing": "Agente processando solicitação...",
                "success": "Agente concluído com sucesso",
                "error": "Agente encontrou um erro",
                "timeout": "Solicitação do agente expirou"
            },
            "gamification": {
                "xp_earned": "Você ganhou {xp} XP!",
                "level_up": "Subiu de nível! Você agora é nível {level}",
                "badge_earned": "Emblema conquistado: {badge}",
                "trust_score_updated": "Pontuação de confiança atualizada: {score}",
                "warning_issued": "Aviso emitido: {reason}",
                "user_banned": "Usuário banido: {reason}",
                "visibility_boost": "Seu multiplicador de visibilidade: {multiplier}x"
            },
            "chat": {
                "session_created": "Sessão de chat criada",
                "message_sent": "Mensagem enviada",
                "message_received": "Mensagem recebida",
                "agent_switched": "Agente mudado para {agent}",
                "history_loaded": "Histórico de chat carregado",
                "error": "Erro de chat ocorreu"
            },
            "template": {
                "validated": "Modelo validado com sucesso",
                "validation_failed": "Falha na validação do modelo",
                "uploaded": "Modelo carregado com sucesso",
                "upload_failed": "Falha no upload do modelo",
                "security_score": "Pontuação de segurança: {score}/100",
                "purchased": "Modelo comprado com sucesso",
                "listed": "Modelo listado no marketplace"
            },
            "analytics": {
                "dashboard": "Painel de Análise",
                "contracts_created": "Contratos Criados",
                "total_volume": "Volume Total",
                "active_users": "Usuários Ativos",
                "success_rate": "Taxa de Sucesso",
                "avg_completion_time": "Tempo Médio de Conclusão",
                "revenue": "Receita",
                "growth": "Crescimento"
            },
            "nft": {
                "minted": "NFT cunhado com sucesso",
                "transferred": "NFT transferido",
                "reputation_updated": "NFT de reputação atualizado",
                "level_badge": "Emblema Nível {level}",
                "trust_badge": "Emblema Confiança {score}",
                "achievement_unlocked": "Conquista desbloqueada: {achievement}"
            },
            "oracle": {
                "dispute_submitted": "Disputa enviada ao oráculo",
                "oracle_deciding": "Oráculo decidindo...",
                "resolution_complete": "Resolução do oráculo concluída",
                "resolution_failed": "Falha na resolução do oráculo",
                "evidence_submitted": "Evidência enviada",
                "voting_started": "Votação iniciada",
                "voting_ended": "Votação encerrada"
            },
            "errors": {
                "internal_server": "Erro interno do servidor",
                "bad_request": "Solicitação incorreta",
                "unauthorized": "Não autorizado",
                "forbidden": "Proibido",
                "not_found": "Não encontrado",
                "validation_error": "Erro de validação",
                "network_error": "Erro de rede",
                "timeout": "Tempo limite da solicitação",
                "insufficient_funds": "Fundos insuficientes",
                "contract_not_found": "Contrato não encontrado",
                "user_not_found": "Usuário não encontrado",
                "agent_unavailable": "Agente AI não disponível"
            }
        }
    
    @staticmethod
    def _get_french_translations() -> Dict[str, Any]:
        """Get French translations."""
        return {
            "common": {
                "success": "Succès",
                "error": "Erreur",
                "warning": "Avertissement",
                "info": "Information",
                "loading": "Chargement...",
                "save": "Enregistrer",
                "cancel": "Annuler",
                "delete": "Supprimer",
                "edit": "Modifier",
                "create": "Créer",
                "update": "Mettre à jour",
                "confirm": "Confirmer",
                "back": "Retour",
                "next": "Suivant",
                "finish": "Terminer",
                "close": "Fermer"
            },
            "auth": {
                "challenge_requested": "Défi d'authentification demandé",
                "challenge_success": "Défi généré avec succès",
                "authentication_success": "Authentification réussie",
                "authentication_failed": "Échec de l'authentification",
                "invalid_signature": "Signature invalide",
                "session_expired": "Session expirée",
                "session_refreshed": "Session renouvelée",
                "logout_success": "Déconnexion réussie",
                "wallet_connected": "Portefeuille connecté: {address}",
                "wallet_disconnected": "Portefeuille déconnecté"
            },
            "contract": {
                "created": "Contrat créé avec succès",
                "updated": "Contrat mis à jour avec succès",
                "deleted": "Contrat supprimé avec succès",
                "generation_started": "Génération de contrat démarrée",
                "generation_complete": "Génération de contrat terminée",
                "generation_failed": "Échec de la génération du contrat",
                "validation_success": "Contrat validé avec succès",
                "validation_failed": "Échec de la validation du contrat",
                "deployed": "Contrat déployé sur la blockchain",
                "deployment_failed": "Échec du déploiement du contrat",
                "milestone_completed": "Jalon terminé",
                "dispute_raised": "Litige initié",
                "dispute_resolved": "Litige résolu",
                "payment_released": "Paiement libéré",
                "escrow_funded": "Escrow financé avec succès"
            },
            "agent": {
                "negotiation": "Agent de Négociation",
                "contract_generator": "Agent Générateur de Contrats",
                "quality": "Agent d'Assurance Qualité",
                "payment": "Agent de Paiements",
                "dispute_resolver": "Agent Résoluteur de Litiges",
                "processing": "Agent en cours de traitement...",
                "success": "Agent terminé avec succès",
                "error": "L'agent a rencontré une erreur",
                "timeout": "Délai d'attente de l'agent expiré"
            },
            "gamification": {
                "xp_earned": "Vous avez gagné {xp} XP!",
                "level_up": "Niveau supérieur! Vous êtes maintenant niveau {level}",
                "badge_earned": "Badge gagné: {badge}",
                "trust_score_updated": "Score de confiance mis à jour: {score}",
                "warning_issued": "Avertissement émis: {reason}",
                "user_banned": "Utilisateur banni: {reason}",
                "visibility_boost": "Votre multiplicateur de visibilité: {multiplier}x"
            },
            "chat": {
                "session_created": "Session de chat créée",
                "message_sent": "Message envoyé",
                "message_received": "Message reçu",
                "agent_switched": "Agent changé en {agent}",
                "history_loaded": "Historique du chat chargé",
                "error": "Erreur de chat survenue"
            },
            "template": {
                "validated": "Modèle validé avec succès",
                "validation_failed": "Échec de la validation du modèle",
                "uploaded": "Modèle téléchargé avec succès",
                "upload_failed": "Échec du téléchargement du modèle",
                "security_score": "Score de sécurité: {score}/100",
                "purchased": "Modèle acheté avec succès",
                "listed": "Modèle listé sur le marketplace"
            },
            "analytics": {
                "dashboard": "Tableau de Bord Analytique",
                "contracts_created": "Contrats Créés",
                "total_volume": "Volume Total",
                "active_users": "Utilisateurs Actifs",
                "success_rate": "Taux de Réussite",
                "avg_completion_time": "Temps Moyen d'Achèvement",
                "revenue": "Revenus",
                "growth": "Croissance"
            },
            "nft": {
                "minted": "NFT frappé avec succès",
                "transferred": "NFT transféré",
                "reputation_updated": "NFT de réputation mis à jour",
                "level_badge": "Badge Niveau {level}",
                "trust_badge": "Badge Confiance {score}",
                "achievement_unlocked": "Succès débloqué: {achievement}"
            },
            "oracle": {
                "dispute_submitted": "Litige soumis à l'oracle",
                "oracle_deciding": "L'oracle décide...",
                "resolution_complete": "Résolution de l'oracle terminée",
                "resolution_failed": "Échec de la résolution de l'oracle",
                "evidence_submitted": "Preuve soumise",
                "voting_started": "Vote commencé",
                "voting_ended": "Vote terminé"
            },
            "errors": {
                "internal_server": "Erreur interne du serveur",
                "bad_request": "Mauvaise requête",
                "unauthorized": "Non autorisé",
                "forbidden": "Interdit",
                "not_found": "Non trouvé",
                "validation_error": "Erreur de validation",
                "network_error": "Erreur réseau",
                "timeout": "Délai d'attente de la requête",
                "insufficient_funds": "Fonds insuffisants",
                "contract_not_found": "Contrat non trouvé",
                "user_not_found": "Utilisateur non trouvé",
                "agent_unavailable": "Agent AI non disponible"
            }
        }

# Global translation manager instance
translation_manager = TranslationManager()

def t(key: str, lang: Optional[str] = None, **kwargs) -> str:
    """Shortcut function for translations."""
    return translation_manager.get(key, lang, **kwargs)

def get_user_language(accept_language: Optional[str] = None) -> str:
    """
    Detect user language from Accept-Language header.
    
    Args:
        accept_language: Accept-Language header value
    
    Returns:
        Language code (e.g., 'en', 'es', 'pt')
    """
    if not accept_language:
        return Language.ENGLISH.value
    
    # Parse Accept-Language header
    # Format: "en-US,en;q=0.9,es;q=0.8"
    languages = []
    for lang_item in accept_language.split(','):
        parts = lang_item.strip().split(';')
        lang_code = parts[0].split('-')[0].lower()
        quality = 1.0
        
        if len(parts) > 1 and parts[1].startswith('q='):
            try:
                quality = float(parts[1][2:])
            except ValueError:
                quality = 1.0
        
        languages.append((lang_code, quality))
    
    # Sort by quality
    languages.sort(key=lambda x: x[1], reverse=True)
    
    # Find first supported language
    supported_languages = [lang.value for lang in Language]
    for lang_code, _ in languages:
        if lang_code in supported_languages:
            return lang_code
    
    return Language.ENGLISH.value

"""
GigChain.io - Internationalization API
REST API endpoints for language and translation management.
"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from i18n_backend import translation_manager, get_user_language, Language

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/i18n", tags=["Internationalization"])

class TranslationResponse(BaseModel):
    """Response model for translation requests."""
    key: str
    translation: str
    language: str
    timestamp: str

class LanguageInfo(BaseModel):
    """Information about a supported language."""
    code: str
    name: str
    native_name: str
    flag: str

class TranslationsResponse(BaseModel):
    """Response model for getting all translations."""
    language: str
    translations: Dict[str, Any]
    timestamp: str

class AddTranslationRequest(BaseModel):
    """Request model for adding a new translation."""
    language: str = Field(..., description="Language code (e.g., 'en', 'es')")
    key: str = Field(..., description="Translation key in dot notation")
    value: str = Field(..., description="Translated text")

@router.get("/languages", response_model=List[LanguageInfo])
async def get_supported_languages():
    """
    Get list of supported languages.
    
    Returns:
        List of supported languages with metadata
    """
    languages = [
        LanguageInfo(
            code=Language.ENGLISH.value,
            name="English",
            native_name="English",
            flag="🇺🇸"
        ),
        LanguageInfo(
            code=Language.SPANISH.value,
            name="Spanish",
            native_name="Español",
            flag="🇪🇸"
        ),
        LanguageInfo(
            code=Language.PORTUGUESE.value,
            name="Portuguese",
            native_name="Português",
            flag="🇧🇷"
        ),
        LanguageInfo(
            code=Language.FRENCH.value,
            name="French",
            native_name="Français",
            flag="🇫🇷"
        ),
        LanguageInfo(
            code=Language.GERMAN.value,
            name="German",
            native_name="Deutsch",
            flag="🇩🇪"
        ),
        LanguageInfo(
            code=Language.CHINESE.value,
            name="Chinese",
            native_name="中文",
            flag="🇨🇳"
        ),
        LanguageInfo(
            code=Language.JAPANESE.value,
            name="Japanese",
            native_name="日本語",
            flag="🇯🇵"
        ),
        LanguageInfo(
            code=Language.KOREAN.value,
            name="Korean",
            native_name="한국어",
            flag="🇰🇷"
        )
    ]
    
    return languages

@router.get("/detect")
async def detect_language(accept_language: Optional[str] = Header(None)):
    """
    Detect user's preferred language from browser headers.
    
    Args:
        accept_language: Accept-Language header from browser
    
    Returns:
        Detected language code and name
    """
    lang_code = get_user_language(accept_language)
    
    lang_names = {
        "en": "English",
        "es": "Español",
        "pt": "Português",
        "fr": "Français",
        "de": "Deutsch",
        "zh": "中文",
        "ja": "日本語",
        "ko": "한국어"
    }
    
    return {
        "detected_language": lang_code,
        "language_name": lang_names.get(lang_code, "English"),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/translations/{language}", response_model=TranslationsResponse)
async def get_translations(language: str):
    """
    Get all translations for a specific language.
    
    Args:
        language: Language code (e.g., 'en', 'es', 'pt')
    
    Returns:
        All translations for the specified language
    """
    if language not in [lang.value for lang in Language]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}. Supported languages: {[lang.value for lang in Language]}"
        )
    
    translations = translation_manager.get_all(language)
    
    if not translations:
        raise HTTPException(
            status_code=404,
            detail=f"No translations found for language: {language}"
        )
    
    return TranslationsResponse(
        language=language,
        translations=translations,
        timestamp=datetime.now().isoformat()
    )

@router.get("/translate")
async def translate_key(
    key: str,
    lang: Optional[str] = None,
    accept_language: Optional[str] = Header(None)
):
    """
    Translate a specific key.
    
    Args:
        key: Translation key in dot notation (e.g., "contract.created")
        lang: Explicit language code (optional, overrides Accept-Language)
        accept_language: Accept-Language header from browser
    
    Returns:
        Translated text for the key
    """
    # Use explicit language or detect from header
    language = lang or get_user_language(accept_language)
    
    translation = translation_manager.get(key, language)
    
    return TranslationResponse(
        key=key,
        translation=translation,
        language=language,
        timestamp=datetime.now().isoformat()
    )

@router.post("/translations/add")
async def add_translation(request: AddTranslationRequest):
    """
    Add or update a translation.
    
    Args:
        request: Translation data (language, key, value)
    
    Returns:
        Success message
    """
    try:
        translation_manager.add_translation(
            lang=request.language,
            key=request.key,
            value=request.value
        )
        
        logger.info(f"Translation added: {request.language}.{request.key}")
        
        return {
            "success": True,
            "message": f"Translation added successfully for {request.language}",
            "language": request.language,
            "key": request.key,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error adding translation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add translation: {str(e)}"
        )

@router.get("/stats")
async def get_translation_stats():
    """
    Get statistics about available translations.
    
    Returns:
        Translation coverage statistics
    """
    stats = {
        "total_languages": len(Language),
        "supported_languages": [lang.value for lang in Language],
        "languages_with_translations": list(translation_manager.translations.keys()),
        "translation_coverage": {}
    }
    
    # Calculate translation coverage for each language
    for lang_code, translations in translation_manager.translations.items():
        def count_keys(d):
            count = 0
            for v in d.values():
                if isinstance(v, dict):
                    count += count_keys(v)
                else:
                    count += 1
            return count
        
        stats["translation_coverage"][lang_code] = count_keys(translations)
    
    stats["timestamp"] = datetime.now().isoformat()
    
    return stats

@router.get("/health")
async def i18n_health_check():
    """
    Health check for i18n system.
    
    Returns:
        System health status
    """
    return {
        "status": "healthy",
        "service": "Internationalization",
        "version": "1.0.0",
        "languages_loaded": len(translation_manager.translations),
        "timestamp": datetime.now().isoformat()
    }

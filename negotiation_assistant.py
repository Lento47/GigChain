"""
Interactive AI Negotiation Assistant for GigChain.io
Provides real-time coaching, insights, and recommendations during contract negotiations
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime
import json

# Import centralized OpenAI service
from services import get_openai_client, OpenAIClientProtocol, MockOpenAIClient


@dataclass
class NegotiationInsight:
    """AI-generated insight about contract"""
    type: str  # 'warning', 'opportunity', 'tip', 'recommendation'
    title: str
    message: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    action_items: List[str]
    highlighted_text: Optional[str] = None


@dataclass
class LearningPath:
    """Recommended learning path for user"""
    skill_gaps: List[str]
    recommended_courses: List[Dict[str, str]]
    estimated_improvement: str
    confidence_boost: float  # 0-100


@dataclass
class NegotiationStrategy:
    """AI-recommended negotiation strategy"""
    approach: str  # 'competitive', 'collaborative', 'compromising'
    key_points: List[str]
    talking_points: List[str]
    expected_outcome_min: float
    expected_outcome_max: float
    success_probability: float  # 0-100


class NegotiationAssistant:
    """Interactive AI assistant for contract negotiation"""
    
    def __init__(self, client: Optional[Union[OpenAIClientProtocol, MockOpenAIClient]] = None):
        """
        Initialize negotiation assistant with proper dependency injection.
        
        Args:
            client: OpenAI client (injected dependency)
        """
        self.client = client or get_openai_client()
        self.model = "gpt-4o-mini"
        self.temperature = 0.3  # Low temperature for consistent advice
    
    def analyze_contract_offer(
        self,
        contract_text: str,
        offered_amount: float,
        user_level: int,
        user_trust_score: float,
        user_experience: int,
        market_rate: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive analysis of contract offer
        
        Returns:
        - Overall assessment
        - Insights and warnings
        - Recommended strategy
        - Learning opportunities
        """
        
        prompt = f"""You are an expert negotiation coach for freelancers on GigChain.io. 
Analyze this contract offer and provide detailed insights.

CONTRACT DETAILS:
{contract_text}

OFFERED AMOUNT: ${offered_amount}
USER LEVEL: {user_level}
USER TRUST SCORE: {user_trust_score}/100
USER COMPLETED CONTRACTS: {user_experience}
MARKET RATE: ${market_rate if market_rate else 'Unknown'}

Provide a comprehensive analysis in JSON format:
{{
  "overall_assessment": {{
    "is_fair": boolean,
    "value_rating": "underpaid/fair/good/excellent",
    "risk_level": "low/medium/high",
    "recommendation": "accept/negotiate/decline",
    "confidence": float (0-100)
  }},
  "insights": [
    {{
      "type": "warning/opportunity/tip/recommendation",
      "title": "string",
      "message": "detailed explanation",
      "severity": "low/medium/high/critical",
      "action_items": ["specific actions to take"]
    }}
  ],
  "negotiation_strategy": {{
    "approach": "competitive/collaborative/compromising",
    "key_points": ["main negotiation points"],
    "talking_points": ["what to say"],
    "counter_offer_min": float,
    "counter_offer_max": float,
    "success_probability": float (0-100)
  }},
  "learning_opportunities": {{
    "skill_gaps": ["skills you need to improve"],
    "recommended_learning": ["specific topics to study"],
    "estimated_improvement": "description of expected improvement",
    "confidence_boost": float (0-100)
  }},
  "market_comparison": {{
    "vs_market_rate": "below/at/above",
    "difference_percentage": float,
    "justification": "explanation"
  }},
  "red_flags": [
    {{
      "flag": "description of concerning element",
      "severity": "low/medium/high/critical",
      "mitigation": "how to address this"
    }}
  ],
  "green_flags": [
    "positive aspects of the offer"
  ]
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert negotiation coach and contract analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            analysis["generated_at"] = datetime.now().isoformat()
            analysis["user_level"] = user_level
            
            return analysis
            
        except Exception as e:
            # Fallback analysis if OpenAI fails
            return self._fallback_analysis(offered_amount, user_level, user_trust_score)
    
    def analyze_highlighted_text(
        self,
        highlighted_text: str,
        full_context: str,
        user_level: int
    ) -> Dict[str, Any]:
        """
        Analyze specific highlighted text from contract
        Provides instant feedback on what user is reading
        """
        
        prompt = f"""User is reviewing a contract and highlighted this text:

HIGHLIGHTED TEXT:
"{highlighted_text}"

FULL CONTEXT:
{full_context}

USER LEVEL: {user_level}

Provide instant, practical advice in JSON format:
{{
  "quick_tip": "one-sentence insight about this clause",
  "explanation": "detailed explanation in simple terms",
  "concerns": ["potential issues to watch for"],
  "questions_to_ask": ["questions user should ask client"],
  "negotiation_angle": "how to use this in negotiation",
  "is_standard": boolean,
  "is_favorable": boolean,
  "complexity": "simple/moderate/complex",
  "action": "accept/negotiate/clarify/reject"
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful contract advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            return {
                "quick_tip": "Review this clause carefully with the client.",
                "explanation": "This clause may require clarification to ensure both parties understand the terms.",
                "concerns": ["Ambiguous language", "Potential for misunderstanding"],
                "questions_to_ask": ["Can you clarify what this means specifically?"],
                "is_standard": True,
                "complexity": "moderate"
            }
    
    def suggest_counter_offer(
        self,
        original_offer: float,
        user_level: int,
        user_experience: int,
        project_complexity: str,
        estimated_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Suggest intelligent counter-offer based on user profile and project
        """
        
        # Calculate base multipliers
        level_multiplier = 1.0 + (user_level * 0.05)  # +5% per level
        experience_multiplier = 1.0 + (min(user_experience, 50) * 0.01)  # +1% per contract, cap at 50
        
        complexity_multipliers = {
            "low": 1.0,
            "medium": 1.15,
            "high": 1.3,
            "expert": 1.5
        }
        complexity_mult = complexity_multipliers.get(project_complexity, 1.15)
        
        # Calculate suggested range
        min_counter = original_offer * level_multiplier
        max_counter = original_offer * level_multiplier * complexity_mult * experience_multiplier
        recommended_counter = (min_counter + max_counter) / 2
        
        prompt = f"""As a negotiation expert, suggest a counter-offer strategy.

ORIGINAL OFFER: ${original_offer}
USER LEVEL: {user_level}
USER EXPERIENCE: {user_experience} contracts
PROJECT COMPLEXITY: {project_complexity}
ESTIMATED HOURS: {estimated_hours or 'Unknown'}

CALCULATED RANGE: ${min_counter:.2f} - ${max_counter:.2f}

Provide negotiation guidance in JSON format:
{{
  "recommended_counter": float,
  "justification": "why this amount is fair",
  "negotiation_script": "what to say to client",
  "fallback_positions": [
    {{"amount": float, "reasoning": "string"}}
  ],
  "value_propositions": ["unique value you bring"],
  "compromise_options": ["alternative terms to negotiate"],
  "confidence_level": float (0-100),
  "expected_client_reaction": "likely response",
  "success_tips": ["specific tips for this negotiation"]
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert negotiation strategist."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["calculated_range"] = {
                "min": round(min_counter, 2),
                "max": round(max_counter, 2)
            }
            
            return result
            
        except Exception as e:
            return {
                "recommended_counter": round(recommended_counter, 2),
                "justification": f"Based on your level {user_level} and {user_experience} contracts of experience.",
                "calculated_range": {
                    "min": round(min_counter, 2),
                    "max": round(max_counter, 2)
                },
                "confidence_level": 70.0
            }
    
    def generate_learning_path(
        self,
        user_level: int,
        current_skills: List[str],
        target_contract_value: float,
        skill_gaps: List[str]
    ) -> LearningPath:
        """
        Generate personalized learning path to improve negotiation skills
        """
        
        prompt = f"""Create a personalized learning path for a freelancer.

CURRENT LEVEL: {user_level}
CURRENT SKILLS: {', '.join(current_skills)}
TARGET CONTRACT VALUE: ${target_contract_value}
IDENTIFIED SKILL GAPS: {', '.join(skill_gaps)}

Provide a learning roadmap in JSON format:
{{
  "skill_gaps": ["prioritized list of skills to develop"],
  "recommended_courses": [
    {{
      "title": "course name",
      "topic": "specific topic",
      "duration": "estimated time",
      "priority": "high/medium/low",
      "free_resource": "link or description"
    }}
  ],
  "practice_exercises": ["practical exercises to do"],
  "estimated_improvement": "realistic timeline and expected results",
  "confidence_boost": float (0-100),
  "quick_wins": ["easy improvements to make immediately"],
  "long_term_goals": ["skills for bigger contracts"]
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career development coach."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return LearningPath(
                skill_gaps=result.get("skill_gaps", []),
                recommended_courses=result.get("recommended_courses", []),
                estimated_improvement=result.get("estimated_improvement", "Improvement expected within 3-6 months"),
                confidence_boost=result.get("confidence_boost", 50.0)
            )
            
        except Exception as e:
            return LearningPath(
                skill_gaps=skill_gaps,
                recommended_courses=[
                    {
                        "title": "Contract Negotiation Basics",
                        "topic": "Negotiation fundamentals",
                        "duration": "2 weeks",
                        "priority": "high",
                        "free_resource": "YouTube: Harvard Negotiation Project"
                    }
                ],
                estimated_improvement="Expected improvement in 1-2 months with consistent practice",
                confidence_boost=30.0
            )
    
    def real_time_negotiation_coach(
        self,
        conversation_history: List[Dict[str, str]],
        current_offer: float,
        target_offer: float
    ) -> Dict[str, Any]:
        """
        Real-time coaching during active negotiation
        Analyzes conversation and provides next-step guidance
        """
        
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['message']}" 
            for msg in conversation_history
        ])
        
        prompt = f"""You are coaching a freelancer during live contract negotiation.

CONVERSATION SO FAR:
{conversation_text}

CURRENT OFFER: ${current_offer}
TARGET OFFER: ${target_offer}

Provide real-time coaching in JSON format:
{{
  "next_move": "specific action to take now",
  "suggested_response": "what to say next",
  "tone": "professional/friendly/firm/collaborative",
  "negotiation_status": "opening/middle/closing/stuck",
  "progress_percentage": float (0-100),
  "warnings": ["things to avoid saying"],
  "opportunities": ["opportunities to leverage"],
  "alternative_approaches": ["backup strategies"],
  "should_accept": boolean,
  "should_walk_away": boolean,
  "reasoning": "why this is the right move"
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a real-time negotiation coach."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            return {
                "next_move": "Continue professional dialogue",
                "suggested_response": "I appreciate your offer. Let me review the details.",
                "tone": "professional",
                "negotiation_status": "middle",
                "progress_percentage": 50.0
            }
    
    def _fallback_analysis(
        self,
        offered_amount: float,
        user_level: int,
        user_trust_score: float
    ) -> Dict[str, Any]:
        """Fallback analysis when OpenAI is unavailable"""
        
        # Simple rule-based analysis
        expected_range_min = 100 * user_level
        expected_range_max = 500 * user_level
        
        is_fair = expected_range_min <= offered_amount <= expected_range_max
        
        return {
            "overall_assessment": {
                "is_fair": is_fair,
                "value_rating": "fair" if is_fair else "underpaid",
                "risk_level": "medium",
                "recommendation": "negotiate" if not is_fair else "accept",
                "confidence": 60.0
            },
            "insights": [
                {
                    "type": "tip",
                    "title": "AI Assistant Unavailable",
                    "message": "Using basic analysis. For detailed insights, ensure OpenAI API is configured.",
                    "severity": "medium",
                    "action_items": ["Review contract carefully", "Compare with market rates"]
                }
            ],
            "negotiation_strategy": {
                "approach": "collaborative",
                "key_points": ["Highlight your experience", "Reference your trust score"],
                "counter_offer_min": offered_amount * 1.1,
                "counter_offer_max": offered_amount * 1.3,
                "success_probability": 70.0
            },
            "generated_at": datetime.now().isoformat(),
            "fallback_mode": True
        }


# Singleton instance
negotiation_assistant = NegotiationAssistant()

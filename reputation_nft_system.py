"""
GigChain.io - Reputation NFT System
Backend integration for reputation NFTs.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from web3 import Web3

logger = logging.getLogger(__name__)

class ReputationLevel(Enum):
    """Reputation level enumeration."""
    NOVICE = 0
    APPRENTICE = 1
    PROFESSIONAL = 2
    EXPERT = 3
    MASTER = 4
    LEGEND = 5

@dataclass
class ReputationData:
    """Reputation NFT data structure."""
    token_id: int
    owner: str
    points: int
    contracts_completed: int
    total_earned: float
    trust_score: int
    disputes_won: int
    disputes_lost: int
    level: int
    level_name: str
    last_updated: str
    is_active: bool
    nft_image_url: str

class ReputationNFTSystem:
    """
    Reputation NFT system for GigChain.
    Manages dynamic NFTs that represent user reputation.
    """
    
    def __init__(
        self,
        web3_provider: Optional[str] = None,
        contract_address: Optional[str] = None,
        contract_abi_path: Optional[str] = None
    ):
        self.web3_provider = web3_provider or os.getenv('WEB3_PROVIDER_URL')
        self.contract_address = contract_address or os.getenv('REPUTATION_NFT_ADDRESS')
        
        # Initialize Web3 if provider available
        self.w3 = None
        self.contract = None
        
        if self.web3_provider:
            try:
                self.w3 = Web3(Web3.HTTPProvider(self.web3_provider))
                
                # Load contract ABI
                if contract_abi_path:
                    with open(contract_abi_path, 'r') as f:
                        abi = json.load(f)
                    self.contract = self.w3.eth.contract(
                        address=self.contract_address,
                        abi=abi
                    )
                    logger.info(f"✅ Connected to Reputation NFT at {self.contract_address}")
            except Exception as e:
                logger.error(f"Failed to connect to blockchain: {str(e)}")
        
        # In-memory reputation storage (fallback)
        self.reputations: Dict[str, ReputationData] = {}
        self.next_token_id = 1
    
    def mint_reputation_nft(self, user_address: str) -> int:
        """
        Mint a reputation NFT for a new user.
        
        Args:
            user_address: User's wallet address
        
        Returns:
            Token ID of minted NFT
        """
        try:
            if user_address in self.reputations:
                raise ValueError(f"User {user_address} already has a reputation NFT")
            
            if self.contract:
                # Mint on blockchain
                tx_hash = self.contract.functions.mintReputation(user_address).transact()
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                
                # Parse event to get token ID
                event = self.contract.events.ReputationMinted().process_receipt(receipt)
                token_id = event[0]['args']['tokenId']
                
                logger.info(f"✅ Reputation NFT {token_id} minted for {user_address}")
            else:
                # Fallback: create in-memory
                token_id = self.next_token_id
                self.next_token_id += 1
                
                logger.info(f"⚠️ Reputation NFT {token_id} created in memory")
            
            # Store reputation data
            reputation = ReputationData(
                token_id=token_id,
                owner=user_address,
                points=0,
                contracts_completed=0,
                total_earned=0.0,
                trust_score=50,  # Neutral starting score
                disputes_won=0,
                disputes_lost=0,
                level=ReputationLevel.NOVICE.value,
                level_name="Novice",
                last_updated=datetime.now().isoformat(),
                is_active=True,
                nft_image_url=self._generate_nft_image_url(token_id)
            )
            
            self.reputations[user_address] = reputation
            
            return token_id
            
        except Exception as e:
            logger.error(f"Error minting reputation NFT: {str(e)}")
            raise
    
    def update_after_contract(
        self,
        user_address: str,
        amount_earned: float,
        rating: int,
        on_time: bool
    ) -> Dict[str, Any]:
        """
        Update reputation after contract completion.
        
        Args:
            user_address: User's wallet address
            amount_earned: Amount earned from contract
            rating: Contract rating (1-5)
            on_time: Whether contract was completed on time
        
        Returns:
            Updated reputation data
        """
        try:
            if user_address not in self.reputations:
                # Auto-mint if user doesn't have NFT
                self.mint_reputation_nft(user_address)
            
            reputation = self.reputations[user_address]
            
            # Calculate points earned
            points_earned = self._calculate_contract_points(amount_earned, rating, on_time)
            
            # Update reputation
            old_level = reputation.level
            reputation.points += points_earned
            reputation.contracts_completed += 1
            reputation.total_earned += amount_earned
            reputation.trust_score = self._calculate_trust_score(reputation)
            reputation.level = self._calculate_level(reputation.points)
            reputation.level_name = self._get_level_name(reputation.level)
            reputation.last_updated = datetime.now().isoformat()
            
            # Check for level up
            level_up = reputation.level > old_level
            
            # Update on blockchain if available
            if self.contract:
                tx_hash = self.contract.functions.updateAfterContract(
                    user_address,
                    int(amount_earned * 100),  # Convert to cents
                    rating,
                    on_time
                ).transact()
                
                self.w3.eth.wait_for_transaction_receipt(tx_hash)
                logger.info(f"✅ Reputation updated on blockchain")
            
            return {
                "reputation": asdict(reputation),
                "points_earned": points_earned,
                "level_up": level_up,
                "old_level": old_level,
                "new_level": reputation.level
            }
            
        except Exception as e:
            logger.error(f"Error updating reputation after contract: {str(e)}")
            raise
    
    def update_after_dispute(
        self,
        user_address: str,
        won: bool
    ) -> Dict[str, Any]:
        """
        Update reputation after dispute resolution.
        
        Args:
            user_address: User's wallet address
            won: Whether user won the dispute
        
        Returns:
            Updated reputation data
        """
        try:
            if user_address not in self.reputations:
                raise ValueError(f"User {user_address} has no reputation NFT")
            
            reputation = self.reputations[user_address]
            
            old_points = reputation.points
            points_change = 50 if won else -100
            
            # Update reputation
            if won:
                reputation.disputes_won += 1
                reputation.points += 50
            else:
                reputation.disputes_lost += 1
                reputation.points = max(0, reputation.points - 100)
            
            reputation.trust_score = self._calculate_trust_score(reputation)
            reputation.level = self._calculate_level(reputation.points)
            reputation.level_name = self._get_level_name(reputation.level)
            reputation.last_updated = datetime.now().isoformat()
            
            # Update on blockchain if available
            if self.contract:
                tx_hash = self.contract.functions.updateAfterDispute(
                    user_address,
                    won
                ).transact()
                
                self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                "reputation": asdict(reputation),
                "points_change": points_change,
                "won_dispute": won
            }
            
        except Exception as e:
            logger.error(f"Error updating reputation after dispute: {str(e)}")
            raise
    
    def get_reputation(self, user_address: str) -> Optional[Dict[str, Any]]:
        """Get user's reputation data."""
        reputation = self.reputations.get(user_address)
        
        if not reputation:
            # Try to fetch from blockchain
            if self.contract:
                try:
                    has_nft = self.contract.functions.hasNFT(user_address).call()
                    if has_nft:
                        rep_data = self.contract.functions.getUserReputation(user_address).call()
                        # Parse and store
                        # ... (implementation depends on contract)
                except Exception as e:
                    logger.error(f"Error fetching reputation from blockchain: {str(e)}")
            
            return None
        
        return asdict(reputation)
    
    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top users by reputation points."""
        sorted_reputations = sorted(
            self.reputations.values(),
            key=lambda x: x.points,
            reverse=True
        )
        
        return [asdict(rep) for rep in sorted_reputations[:limit]]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get reputation system statistics."""
        total_nfts = len(self.reputations)
        
        level_distribution = {level.name: 0 for level in ReputationLevel}
        total_points = 0
        total_contracts = 0
        
        for rep in self.reputations.values():
            level_name = self._get_level_name(rep.level)
            level_distribution[level_name.upper()] = level_distribution.get(level_name.upper(), 0) + 1
            total_points += rep.points
            total_contracts += rep.contracts_completed
        
        return {
            "total_nfts": total_nfts,
            "total_points_earned": total_points,
            "total_contracts_completed": total_contracts,
            "level_distribution": level_distribution,
            "average_points": total_points / total_nfts if total_nfts > 0 else 0,
            "average_contracts": total_contracts / total_nfts if total_nfts > 0 else 0
        }
    
    def _calculate_contract_points(self, amount: float, rating: int, on_time: bool) -> int:
        """Calculate points earned from a contract."""
        # Base points from amount (1 point per $10)
        base_points = int(amount / 10)
        
        # Rating multiplier (1.0x to 2.0x)
        rating_multiplier = 1.0 + (rating - 1) * 0.2
        
        # On-time bonus
        time_bonus = 1.25 if on_time else 1.0
        
        # Calculate total points
        points = int(base_points * rating_multiplier * time_bonus)
        
        # Minimum 10 points per contract
        return max(points, 10)
    
    def _calculate_trust_score(self, rep: ReputationData) -> int:
        """Calculate trust score (0-100)."""
        if rep.contracts_completed == 0:
            return 50  # Neutral for new users
        
        total_disputes = rep.disputes_won + rep.disputes_lost
        
        # Base trust from completion rate (assume 95% completion)
        base_trust = 95
        
        # Adjust for disputes
        if total_disputes > 0:
            dispute_win_rate = (rep.disputes_won * 100) // total_disputes
            base_trust = (base_trust + dispute_win_rate) // 2
        
        # Adjust for total contracts (bonus for experience)
        if rep.contracts_completed >= 100:
            base_trust = min(100, base_trust + 5)
        elif rep.contracts_completed >= 50:
            base_trust = min(100, base_trust + 3)
        
        return min(base_trust, 100)
    
    def _calculate_level(self, points: int) -> int:
        """Calculate reputation level based on points."""
        if points >= 5000:
            return ReputationLevel.LEGEND.value
        elif points >= 2500:
            return ReputationLevel.MASTER.value
        elif points >= 1000:
            return ReputationLevel.EXPERT.value
        elif points >= 500:
            return ReputationLevel.PROFESSIONAL.value
        elif points >= 100:
            return ReputationLevel.APPRENTICE.value
        else:
            return ReputationLevel.NOVICE.value
    
    def _get_level_name(self, level: int) -> str:
        """Get level name from level value."""
        level_names = {
            ReputationLevel.NOVICE.value: "Novice",
            ReputationLevel.APPRENTICE.value: "Apprentice",
            ReputationLevel.PROFESSIONAL.value: "Professional",
            ReputationLevel.EXPERT.value: "Expert",
            ReputationLevel.MASTER.value: "Master",
            ReputationLevel.LEGEND.value: "Legend"
        }
        return level_names.get(level, "Novice")
    
    def _generate_nft_image_url(self, token_id: int) -> str:
        """Generate NFT image URL."""
        # In production, this would return actual NFT metadata URI
        return f"https://gigchain.io/nft/{token_id}/image"

# Global reputation NFT system instance
reputation_nft = ReputationNFTSystem()

def mint_user_reputation(user_address: str) -> int:
    """Convenience function to mint reputation NFT."""
    return reputation_nft.mint_reputation_nft(user_address)

def update_reputation_contract(user_address: str, **kwargs) -> Dict[str, Any]:
    """Convenience function to update reputation after contract."""
    return reputation_nft.update_after_contract(user_address, **kwargs)

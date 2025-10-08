"""
GigChain.io - Dispute Resolution Oracle System
Backend integration for decentralized dispute resolution.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass, asdict
import hashlib
from web3 import Web3

logger = logging.getLogger(__name__)

class DisputeStatus(str, Enum):
    """Dispute status enumeration."""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

class DisputeOutcome(str, Enum):
    """Dispute resolution outcomes."""
    NONE = "none"
    FREELANCER_WINS = "freelancer_wins"
    CLIENT_WINS = "client_wins"
    SPLIT = "split"
    ESCALATED = "escalated"

@dataclass
class Evidence:
    """Evidence submission structure."""
    submitter: str
    evidence_hash: str  # IPFS hash
    evidence_url: str
    description: str
    timestamp: str
    file_type: str

@dataclass
class Dispute:
    """Dispute data structure."""
    dispute_id: int
    contract_id: str
    contract_address: str
    freelancer: str
    client: str
    amount: float
    description: str
    freelancer_evidence: List[Evidence]
    client_evidence: List[Evidence]
    status: DisputeStatus
    outcome: DisputeOutcome
    freelancer_votes: int
    client_votes: int
    created_at: str
    resolved_at: Optional[str]
    voting_deadline: str

@dataclass
class OracleVoter:
    """Oracle voter information."""
    address: str
    reputation: int
    stake: float
    total_votes: int
    correct_votes: int
    accuracy: float

class DisputeOracleSystem:
    """
    Dispute resolution oracle system integrating with blockchain.
    """
    
    def __init__(
        self,
        web3_provider: Optional[str] = None,
        contract_address: Optional[str] = None,
        contract_abi_path: Optional[str] = None
    ):
        self.web3_provider = web3_provider or os.getenv('WEB3_PROVIDER_URL')
        self.contract_address = contract_address or os.getenv('DISPUTE_ORACLE_ADDRESS')
        
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
                    logger.info(f"✅ Connected to Dispute Oracle at {self.contract_address}")
            except Exception as e:
                logger.error(f"Failed to connect to blockchain: {str(e)}")
        
        # In-memory dispute storage (fallback)
        self.disputes: Dict[int, Dispute] = {}
        self.next_dispute_id = 1
        
        # Oracle configuration
        self.min_stake = 0.1  # Minimum stake in ETH
        self.voting_period = 7 * 24 * 3600  # 7 days in seconds
        self.quorum = 3  # Minimum votes required
        self.reward_per_vote = 0.001  # Reward in ETH
    
    def create_dispute(
        self,
        contract_id: str,
        contract_address: str,
        freelancer: str,
        client: str,
        amount: float,
        description: str
    ) -> int:
        """
        Create a new dispute.
        
        Args:
            contract_id: GigChain contract ID
            contract_address: Blockchain contract address
            freelancer: Freelancer wallet address
            client: Client wallet address
            amount: Disputed amount
            description: Dispute description
        
        Returns:
            Dispute ID
        """
        try:
            if self.contract:
                # Create dispute on blockchain
                tx_hash = self.contract.functions.createDispute(
                    contract_address,
                    freelancer,
                    client,
                    self.w3.to_wei(amount, 'ether'),
                    description
                ).transact({'from': client})  # Assuming client initiates
                
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                
                # Parse event to get dispute ID
                event = self.contract.events.DisputeCreated().process_receipt(receipt)
                dispute_id = event[0]['args']['disputeId']
                
                logger.info(f"✅ Dispute {dispute_id} created on blockchain")
            else:
                # Fallback: create in-memory
                dispute_id = self.next_dispute_id
                self.next_dispute_id += 1
                
                logger.info(f"⚠️ Dispute {dispute_id} created in memory (no blockchain)")
            
            # Store dispute data
            dispute = Dispute(
                dispute_id=dispute_id,
                contract_id=contract_id,
                contract_address=contract_address,
                freelancer=freelancer,
                client=client,
                amount=amount,
                description=description,
                freelancer_evidence=[],
                client_evidence=[],
                status=DisputeStatus.PENDING,
                outcome=DisputeOutcome.NONE,
                freelancer_votes=0,
                client_votes=0,
                created_at=datetime.now().isoformat(),
                resolved_at=None,
                voting_deadline=(datetime.now() + timedelta(seconds=self.voting_period)).isoformat()
            )
            
            self.disputes[dispute_id] = dispute
            
            return dispute_id
            
        except Exception as e:
            logger.error(f"Error creating dispute: {str(e)}")
            raise
    
    def submit_evidence(
        self,
        dispute_id: int,
        submitter: str,
        evidence_hash: str,
        evidence_url: str,
        description: str,
        file_type: str = "document"
    ) -> bool:
        """
        Submit evidence for a dispute.
        
        Args:
            dispute_id: Dispute ID
            submitter: Address of submitter (freelancer or client)
            evidence_hash: IPFS hash of evidence
            evidence_url: URL to access evidence
            description: Evidence description
            file_type: Type of evidence file
        
        Returns:
            Success status
        """
        try:
            dispute = self.disputes.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            if dispute.status not in [DisputeStatus.PENDING, DisputeStatus.UNDER_REVIEW]:
                raise ValueError(f"Cannot submit evidence for {dispute.status} dispute")
            
            if submitter not in [dispute.freelancer, dispute.client]:
                raise ValueError("Submitter must be party to dispute")
            
            # Create evidence object
            evidence = Evidence(
                submitter=submitter,
                evidence_hash=evidence_hash,
                evidence_url=evidence_url,
                description=description,
                timestamp=datetime.now().isoformat(),
                file_type=file_type
            )
            
            # Add to appropriate evidence list
            if submitter == dispute.freelancer:
                dispute.freelancer_evidence.append(evidence)
            else:
                dispute.client_evidence.append(evidence)
            
            # Move to under review if first evidence
            if dispute.status == DisputeStatus.PENDING:
                dispute.status = DisputeStatus.UNDER_REVIEW
            
            # Submit to blockchain if available
            if self.contract:
                tx_hash = self.contract.functions.submitEvidence(
                    dispute_id,
                    evidence_hash
                ).transact({'from': submitter})
                
                self.w3.eth.wait_for_transaction_receipt(tx_hash)
                logger.info(f"✅ Evidence submitted to blockchain for dispute {dispute_id}")
            
            logger.info(f"Evidence submitted for dispute {dispute_id} by {submitter[:10]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error submitting evidence: {str(e)}")
            raise
    
    def cast_vote(
        self,
        dispute_id: int,
        oracle_address: str,
        outcome: DisputeOutcome
    ) -> bool:
        """
        Cast a vote on a dispute.
        
        Args:
            dispute_id: Dispute ID
            oracle_address: Oracle voter address
            outcome: Voting outcome
        
        Returns:
            Success status
        """
        try:
            dispute = self.disputes.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            if dispute.status != DisputeStatus.UNDER_REVIEW:
                raise ValueError("Dispute not under review")
            
            # Check voting deadline
            deadline = datetime.fromisoformat(dispute.voting_deadline)
            if datetime.now() > deadline:
                raise ValueError("Voting period ended")
            
            # Validate outcome
            if outcome not in [DisputeOutcome.FREELANCER_WINS, DisputeOutcome.CLIENT_WINS]:
                raise ValueError("Invalid outcome")
            
            # Tally vote
            if outcome == DisputeOutcome.FREELANCER_WINS:
                dispute.freelancer_votes += 1
            elif outcome == DisputeOutcome.CLIENT_WINS:
                dispute.client_votes += 1
            
            # Submit to blockchain if available
            if self.contract:
                outcome_index = 1 if outcome == DisputeOutcome.FREELANCER_WINS else 2
                tx_hash = self.contract.functions.castVote(
                    dispute_id,
                    outcome_index
                ).transact({'from': oracle_address})
                
                self.w3.eth.wait_for_transaction_receipt(tx_hash)
                logger.info(f"✅ Vote submitted to blockchain")
            
            # Check if quorum reached
            total_votes = dispute.freelancer_votes + dispute.client_votes
            if total_votes >= self.quorum:
                self._resolve_dispute(dispute_id)
            
            logger.info(f"Vote cast for dispute {dispute_id}: {outcome}")
            return True
            
        except Exception as e:
            logger.error(f"Error casting vote: {str(e)}")
            raise
    
    def _resolve_dispute(self, dispute_id: int):
        """
        Resolve dispute based on votes.
        
        Args:
            dispute_id: Dispute ID
        """
        dispute = self.disputes.get(dispute_id)
        if not dispute:
            return
        
        # Determine outcome
        if dispute.freelancer_votes > dispute.client_votes:
            dispute.outcome = DisputeOutcome.FREELANCER_WINS
        elif dispute.client_votes > dispute.freelancer_votes:
            dispute.outcome = DisputeOutcome.CLIENT_WINS
        else:
            dispute.outcome = DisputeOutcome.SPLIT
        
        dispute.status = DisputeStatus.RESOLVED
        dispute.resolved_at = datetime.now().isoformat()
        
        logger.info(f"✅ Dispute {dispute_id} resolved: {dispute.outcome}")
    
    def get_dispute(self, dispute_id: int) -> Optional[Dict[str, Any]]:
        """Get dispute details."""
        dispute = self.disputes.get(dispute_id)
        if not dispute:
            # Try to fetch from blockchain
            if self.contract:
                try:
                    result = self.contract.functions.getDispute(dispute_id).call()
                    # Parse blockchain result
                    # ... (implementation depends on contract)
                except Exception as e:
                    logger.error(f"Error fetching dispute from blockchain: {str(e)}")
            return None
        
        return asdict(dispute)
    
    def get_user_disputes(self, user_address: str) -> List[Dict[str, Any]]:
        """Get all disputes for a user."""
        user_disputes = []
        
        for dispute in self.disputes.values():
            if dispute.freelancer == user_address or dispute.client == user_address:
                user_disputes.append(asdict(dispute))
        
        return user_disputes
    
    def get_active_disputes(self) -> List[Dict[str, Any]]:
        """Get all active disputes for oracle voting."""
        active_disputes = []
        
        for dispute in self.disputes.values():
            if dispute.status == DisputeStatus.UNDER_REVIEW:
                # Check if voting period still active
                deadline = datetime.fromisoformat(dispute.voting_deadline)
                if datetime.now() <= deadline:
                    active_disputes.append(asdict(dispute))
        
        return active_disputes
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get dispute system statistics."""
        total_disputes = len(self.disputes)
        pending_disputes = sum(1 for d in self.disputes.values() if d.status == DisputeStatus.PENDING)
        under_review = sum(1 for d in self.disputes.values() if d.status == DisputeStatus.UNDER_REVIEW)
        resolved_disputes = sum(1 for d in self.disputes.values() if d.status == DisputeStatus.RESOLVED)
        
        # Calculate outcome distribution
        outcomes = {
            DisputeOutcome.FREELANCER_WINS: 0,
            DisputeOutcome.CLIENT_WINS: 0,
            DisputeOutcome.SPLIT: 0,
            DisputeOutcome.ESCALATED: 0
        }
        
        for dispute in self.disputes.values():
            if dispute.status == DisputeStatus.RESOLVED:
                outcomes[dispute.outcome] = outcomes.get(dispute.outcome, 0) + 1
        
        return {
            "total_disputes": total_disputes,
            "pending_disputes": pending_disputes,
            "under_review": under_review,
            "resolved_disputes": resolved_disputes,
            "outcome_distribution": {k.value: v for k, v in outcomes.items()},
            "resolution_rate": (resolved_disputes / total_disputes * 100) if total_disputes > 0 else 0
        }

# Global oracle system instance
dispute_oracle = DisputeOracleSystem()

def create_dispute_from_contract(contract_id: str, **kwargs) -> int:
    """Convenience function to create dispute."""
    return dispute_oracle.create_dispute(contract_id, **kwargs)

def submit_dispute_evidence(dispute_id: int, **kwargs) -> bool:
    """Convenience function to submit evidence."""
    return dispute_oracle.submit_evidence(dispute_id, **kwargs)

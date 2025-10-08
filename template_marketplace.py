"""
GigChain.io - Template Marketplace System
Buy, sell, and trade contract templates on the marketplace.
"""

import sqlite3
import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class TemplateCategory(str, Enum):
    """Template categories."""
    WEB_DEVELOPMENT = "web_development"
    MOBILE_DEVELOPMENT = "mobile_development"
    DESIGN = "design"
    WRITING = "writing"
    MARKETING = "marketing"
    CONSULTING = "consulting"
    LEGAL = "legal"
    GENERAL = "general"

class TemplateLicense(str, Enum):
    """Template license types."""
    SINGLE_USE = "single_use"      # One-time use only
    MULTI_USE = "multi_use"        # Unlimited uses
    COMMERCIAL = "commercial"      # Commercial use allowed
    PERSONAL = "personal"          # Personal use only

@dataclass
class Template:
    """Template data structure."""
    template_id: str
    title: str
    description: str
    category: str
    author: str
    price: float
    license_type: str
    template_data: Dict[str, Any]
    preview_image: str
    downloads: int
    rating: float
    review_count: int
    created_at: str
    updated_at: str
    is_active: bool
    tags: List[str]

@dataclass
class Purchase:
    """Purchase record."""
    purchase_id: str
    template_id: str
    buyer: str
    seller: str
    price: float
    license_type: str
    purchased_at: str
    transaction_hash: Optional[str]

class TemplateMarketplace:
    """
    Template marketplace for buying and selling contract templates.
    """
    
    def __init__(self, db_path: str = "marketplace.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize marketplace database schema."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Templates table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS templates (
                    template_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    category TEXT NOT NULL,
                    author TEXT NOT NULL,
                    price REAL NOT NULL,
                    license_type TEXT NOT NULL,
                    template_data TEXT NOT NULL,
                    preview_image TEXT,
                    downloads INTEGER DEFAULT 0,
                    rating REAL DEFAULT 0.0,
                    review_count INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    tags TEXT
                )
            ''')
            
            # Purchases table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS purchases (
                    purchase_id TEXT PRIMARY KEY,
                    template_id TEXT NOT NULL,
                    buyer TEXT NOT NULL,
                    seller TEXT NOT NULL,
                    price REAL NOT NULL,
                    license_type TEXT NOT NULL,
                    purchased_at TEXT NOT NULL,
                    transaction_hash TEXT,
                    FOREIGN KEY (template_id) REFERENCES templates(template_id)
                )
            ''')
            
            # Reviews table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS reviews (
                    review_id TEXT PRIMARY KEY,
                    template_id TEXT NOT NULL,
                    reviewer TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (template_id) REFERENCES templates(template_id)
                )
            ''')
            
            # Author earnings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS author_earnings (
                    author TEXT PRIMARY KEY,
                    total_sales INTEGER DEFAULT 0,
                    total_revenue REAL DEFAULT 0.0,
                    total_downloads INTEGER DEFAULT 0,
                    average_rating REAL DEFAULT 0.0
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_templates_author ON templates(author)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_templates_price ON templates(price)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_purchases_template ON purchases(template_id)')
            
            conn.commit()
    
    def list_template(
        self,
        author: str,
        title: str,
        description: str,
        category: str,
        price: float,
        license_type: str,
        template_data: Dict[str, Any],
        preview_image: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """
        List a new template for sale on the marketplace.
        
        Args:
            author: Creator's wallet address
            title: Template title
            description: Template description
            category: Template category
            price: Sale price
            license_type: License type
            template_data: Template JSON data
            preview_image: Preview image URL
            tags: Template tags
        
        Returns:
            Template ID
        """
        try:
            # Generate template ID
            template_id = hashlib.sha256(
                f"{author}{title}{datetime.now().isoformat()}".encode()
            ).hexdigest()[:16]
            
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO templates
                    (template_id, title, description, category, author, price,
                     license_type, template_data, preview_image, downloads, rating,
                     review_count, created_at, updated_at, is_active, tags)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0, ?, ?, 1, ?)
                ''', (
                    template_id,
                    title,
                    description,
                    category,
                    author,
                    price,
                    license_type,
                    json.dumps(template_data),
                    preview_image,
                    now,
                    now,
                    json.dumps(tags) if tags else None
                ))
                
                # Initialize author earnings if new
                cursor.execute('''
                    INSERT OR IGNORE INTO author_earnings (author, total_sales, total_revenue, total_downloads, average_rating)
                    VALUES (?, 0, 0.0, 0, 0.0)
                ''', (author,))
                
                conn.commit()
            
            logger.info(f"✅ Template {template_id} listed by {author}")
            return template_id
            
        except Exception as e:
            logger.error(f"Error listing template: {str(e)}")
            raise
    
    def purchase_template(
        self,
        template_id: str,
        buyer: str,
        transaction_hash: Optional[str] = None
    ) -> str:
        """
        Purchase a template from the marketplace.
        
        Args:
            template_id: Template ID
            buyer: Buyer's wallet address
            transaction_hash: Blockchain transaction hash
        
        Returns:
            Purchase ID
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get template details
                cursor.execute('''
                    SELECT author, price, license_type, downloads
                    FROM templates
                    WHERE template_id = ? AND is_active = 1
                ''', (template_id,))
                
                result = cursor.fetchone()
                if not result:
                    raise ValueError(f"Template {template_id} not found or inactive")
                
                author, price, license_type, downloads = result
                
                # Generate purchase ID
                purchase_id = hashlib.sha256(
                    f"{buyer}{template_id}{datetime.now().isoformat()}".encode()
                ).hexdigest()[:16]
                
                # Record purchase
                cursor.execute('''
                    INSERT INTO purchases
                    (purchase_id, template_id, buyer, seller, price, license_type, purchased_at, transaction_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    purchase_id,
                    template_id,
                    buyer,
                    author,
                    price,
                    license_type,
                    datetime.now().isoformat(),
                    transaction_hash
                ))
                
                # Update template downloads
                cursor.execute('''
                    UPDATE templates
                    SET downloads = ?
                    WHERE template_id = ?
                ''', (downloads + 1, template_id))
                
                # Update author earnings
                cursor.execute('''
                    UPDATE author_earnings
                    SET total_sales = total_sales + 1,
                        total_revenue = total_revenue + ?,
                        total_downloads = total_downloads + 1
                    WHERE author = ?
                ''', (price, author))
                
                conn.commit()
            
            logger.info(f"✅ Template {template_id} purchased by {buyer}")
            return purchase_id
            
        except Exception as e:
            logger.error(f"Error purchasing template: {str(e)}")
            raise
    
    def submit_review(
        self,
        template_id: str,
        reviewer: str,
        rating: int,
        comment: Optional[str] = None
    ) -> str:
        """
        Submit a review for a purchased template.
        
        Args:
            template_id: Template ID
            reviewer: Reviewer's wallet address
            rating: Rating (1-5)
            comment: Review comment
        
        Returns:
            Review ID
        """
        try:
            if not (1 <= rating <= 5):
                raise ValueError("Rating must be between 1 and 5")
            
            # Generate review ID
            review_id = hashlib.sha256(
                f"{reviewer}{template_id}{datetime.now().isoformat()}".encode()
            ).hexdigest()[:16]
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if template exists
                cursor.execute('SELECT template_id FROM templates WHERE template_id = ?', (template_id,))
                if not cursor.fetchone():
                    raise ValueError(f"Template {template_id} not found")
                
                # Insert review
                cursor.execute('''
                    INSERT INTO reviews (review_id, template_id, reviewer, rating, comment, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    review_id,
                    template_id,
                    reviewer,
                    rating,
                    comment,
                    datetime.now().isoformat()
                ))
                
                # Update template rating
                cursor.execute('''
                    SELECT AVG(rating), COUNT(*)
                    FROM reviews
                    WHERE template_id = ?
                ''', (template_id,))
                
                avg_rating, review_count = cursor.fetchone()
                
                cursor.execute('''
                    UPDATE templates
                    SET rating = ?, review_count = ?
                    WHERE template_id = ?
                ''', (avg_rating, review_count, template_id))
                
                conn.commit()
            
            logger.info(f"✅ Review submitted for template {template_id}")
            return review_id
            
        except Exception as e:
            logger.error(f"Error submitting review: {str(e)}")
            raise
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template details."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT template_id, title, description, category, author, price,
                       license_type, template_data, preview_image, downloads, rating,
                       review_count, created_at, updated_at, is_active, tags
                FROM templates
                WHERE template_id = ?
            ''', (template_id,))
            
            result = cursor.fetchone()
            if not result:
                return None
            
            return {
                "template_id": result[0],
                "title": result[1],
                "description": result[2],
                "category": result[3],
                "author": result[4],
                "price": result[5],
                "license_type": result[6],
                "template_data": json.loads(result[7]),
                "preview_image": result[8],
                "downloads": result[9],
                "rating": result[10],
                "review_count": result[11],
                "created_at": result[12],
                "updated_at": result[13],
                "is_active": bool(result[14]),
                "tags": json.loads(result[15]) if result[15] else []
            }
    
    def search_templates(
        self,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        search_query: Optional[str] = None,
        sort_by: str = "downloads",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search templates with filters."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM templates WHERE is_active = 1"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
            
            if min_price is not None:
                query += " AND price >= ?"
                params.append(min_price)
            
            if max_price is not None:
                query += " AND price <= ?"
                params.append(max_price)
            
            if min_rating is not None:
                query += " AND rating >= ?"
                params.append(min_rating)
            
            if search_query:
                query += " AND (title LIKE ? OR description LIKE ?)"
                params.extend([f"%{search_query}%", f"%{search_query}%"])
            
            # Sort by
            sort_column = {
                "downloads": "downloads DESC",
                "rating": "rating DESC",
                "price_low": "price ASC",
                "price_high": "price DESC",
                "newest": "created_at DESC"
            }.get(sort_by, "downloads DESC")
            
            query += f" ORDER BY {sort_column} LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                template = dict(zip(columns, row))
                template["template_data"] = json.loads(template["template_data"])
                template["tags"] = json.loads(template["tags"]) if template["tags"] else []
                template["is_active"] = bool(template["is_active"])
                results.append(template)
            
            return results
    
    def get_user_purchases(self, buyer: str) -> List[Dict[str, Any]]:
        """Get all purchases by a user."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT p.*, t.title, t.template_data
                FROM purchases p
                JOIN templates t ON p.template_id = t.template_id
                WHERE p.buyer = ?
                ORDER BY p.purchased_at DESC
            ''', (buyer,))
            
            columns = [desc[0] for desc in cursor.description]
            purchases = []
            
            for row in cursor.fetchall():
                purchase = dict(zip(columns, row))
                if purchase.get("template_data"):
                    purchase["template_data"] = json.loads(purchase["template_data"])
                purchases.append(purchase)
            
            return purchases
    
    def get_author_templates(self, author: str) -> List[Dict[str, Any]]:
        """Get all templates by an author."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM templates
                WHERE author = ?
                ORDER BY created_at DESC
            ''', (author,))
            
            columns = [desc[0] for desc in cursor.description]
            templates = []
            
            for row in cursor.fetchall():
                template = dict(zip(columns, row))
                template["template_data"] = json.loads(template["template_data"])
                template["tags"] = json.loads(template["tags"]) if template["tags"] else []
                template["is_active"] = bool(template["is_active"])
                templates.append(template)
            
            return templates
    
    def get_author_earnings(self, author: str) -> Dict[str, Any]:
        """Get author earnings statistics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT total_sales, total_revenue, total_downloads, average_rating
                FROM author_earnings
                WHERE author = ?
            ''', (author,))
            
            result = cursor.fetchone()
            
            if not result:
                return {
                    "author": author,
                    "total_sales": 0,
                    "total_revenue": 0.0,
                    "total_downloads": 0,
                    "average_rating": 0.0
                }
            
            return {
                "author": author,
                "total_sales": result[0],
                "total_revenue": result[1],
                "total_downloads": result[2],
                "average_rating": result[3]
            }
    
    def get_marketplace_statistics(self) -> Dict[str, Any]:
        """Get marketplace statistics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total templates
            cursor.execute('SELECT COUNT(*) FROM templates WHERE is_active = 1')
            total_templates = cursor.fetchone()[0]
            
            # Total sales
            cursor.execute('SELECT COUNT(*), SUM(price) FROM purchases')
            total_sales, total_volume = cursor.fetchone()
            
            # Category distribution
            cursor.execute('''
                SELECT category, COUNT(*) as count
                FROM templates
                WHERE is_active = 1
                GROUP BY category
                ORDER BY count DESC
            ''')
            
            category_distribution = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Top templates
            cursor.execute('''
                SELECT template_id, title, downloads, rating
                FROM templates
                WHERE is_active = 1
                ORDER BY downloads DESC
                LIMIT 10
            ''')
            
            top_templates = [
                {"template_id": row[0], "title": row[1], "downloads": row[2], "rating": row[3]}
                for row in cursor.fetchall()
            ]
            
            return {
                "total_templates": total_templates,
                "total_sales": total_sales or 0,
                "total_volume": total_volume or 0.0,
                "category_distribution": category_distribution,
                "top_templates": top_templates
            }

# Global marketplace instance
marketplace = TemplateMarketplace()

def list_template_for_sale(author: str, **kwargs) -> str:
    """Convenience function to list template."""
    return marketplace.list_template(author, **kwargs)

def purchase_marketplace_template(template_id: str, buyer: str, **kwargs) -> str:
    """Convenience function to purchase template."""
    return marketplace.purchase_template(template_id, buyer, **kwargs)

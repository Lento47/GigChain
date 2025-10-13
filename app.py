"""GigChain API Server: Flask-based deployment for contract AI agents."""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
from contract_ai import full_flow, generate_contract

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Restrictive CORS: allow only explicit origins for /api/* routes
allowed_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173'
)
origins_list = [o.strip() for o in allowed_origins.split(',') if o.strip()]
CORS(
    app,
    resources={r"/api/*": {"origins": origins_list}},
    supports_credentials=True,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)

# Configuration
secret_key = os.getenv('SECRET_KEY')
if not secret_key:
    raise ValueError(
        "SECRET_KEY environment variable is required. "
        "Generate a secure 32+ character secret key."
    )
app.config['SECRET_KEY'] = secret_key
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

@app.before_request
def validate_openai_key():
    """Validate OpenAI API key is present."""
    if not app.config['OPENAI_API_KEY']:
        return jsonify({
            'error': 'OpenAI API key not configured',
            'message': 'Please set OPENAI_API_KEY environment variable'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'GigChain API',
        'version': '1.0.0'
    })

@app.route('/api/full_flow', methods=['POST'])
def api_full_flow():
    """Main endpoint for AI-powered contract generation with agent chaining."""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text',
                'message': 'Please provide contract description in text field'
            }), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({
                'error': 'Empty text field',
                'message': 'Contract description cannot be empty'
            }), 400
        
        logger.info(f"Processing contract request: {text[:100]}...")
        
        # Process with full AI flow
        result = full_flow(text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'full_flow',
            'processing_time': 'calculated_by_client'
        }
        
        logger.info(f"Successfully generated contract: {result.get('contract_id', 'unknown')}")
        return jsonify(result)
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            'error': 'Validation error',
            'message': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while processing your request'
        }), 500

@app.route('/api/contract', methods=['POST'])
def api_contract():
    """Simple contract generation endpoint (rule-based only)."""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text',
                'message': 'Please provide contract description in text field'
            }), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({
                'error': 'Empty text field',
                'message': 'Contract description cannot be empty'
            }), 400
        
        logger.info(f"Processing simple contract: {text[:100]}...")
        
        # Process with rule-based generation only
        result = generate_contract(text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'contract',
            'processing_time': 'calculated_by_client'
        }
        
        logger.info("Successfully generated simple contract")
        return jsonify(result)
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            'error': 'Validation error',
            'message': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred while processing your request'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist',
        'available_endpoints': ['/health', '/api/full_flow', '/api/contract']
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method not allowed',
        'message': 'The HTTP method is not allowed for this endpoint'
    }), 405

if __name__ == '__main__':
    # Development server
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting GigChain API server on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

#!/usr/bin/env python3
"""
HMX FPV Tours Platform - Main Flask Application
Enhanced with detailed booking system and costing calculations
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
from functools import wraps
import os
from werkzeug.security import generate_password_hash, check_password_hash
from phonepe_payment import phonepe
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DATABASE = 'hmx.db'

# Costing table for different categories and sizes
COSTING_TABLE = {
    'Retail Store / Showroom': {
        '<1000': 5999,
        '1000-5000': 9999,
        '5000-10000': 15999,
        '10000-50000': 20999,
        '50000+': 'Custom Quote'
    },
    'Restaurants & Cafes': {
        '<1000': 7999,
        '1000-5000': 11999,
        '5000-10000': 19999,
        '10000-50000': 25999,
        '50000+': 'Custom Quote'
    },
    'Fitness & Sports Arenas': {
        '<1000': 9999,
        '1000-5000': 13999,
        '5000-10000': 22999,
        '10000-50000': 31999,
        '50000+': 'Custom Quote'
    },
    'Resorts & Farmstays / Hotels': {
        '<1000': 11999,
        '1000-5000': 17999,
        '5000-10000': 29999,
        '10000-50000': 39999,
        '50000+': 'Custom Quote'
    },
    'Real Estate Property': {
        '<1000': 13999,
        '1000-5000': 23999,
        '5000-10000': 37999,
        '10000-50000': 49999,
        '50000+': 'Custom Quote'
    },
    'Shopping Mall / Complex': {
        '<1000': 15999,
        '1000-5000': 29999,
        '5000-10000': 47999,
        '10000-50000': 63999,
        '50000+': 'Custom Quote'
    },
    'Adventure / Water Parks': {
        '<1000': 12999,
        '1000-5000': 23999,
        '5000-10000': 39999,
        '10000-50000': 55999,
        '50000+': 'Custom Quote'
    },
    'Gaming & Entertainment Zones': {
        '<1000': 10999,
        '1000-5000': 19999,
        '5000-10000': 33999,
        '10000-50000': 45999,
        '50000+': 'Custom Quote'
    }
}

# Earnings distribution percentages
EARNINGS_DISTRIBUTION = {
    'pilot': 50.0,      # 50% for pilot
    'editor': 15.0,     # 15% for editor
    'referral': 12.5,   # 12.5% for referral
    'hmx': 20.0,        # 20% for HMX operations
    'payment_gateway': 2.5  # 2.5% for payment gateway
}

def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database with enhanced schema"""
    with app.app_context():
        db = get_db()
        
        # Enhanced users table
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT,
                contact_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'client',
                approval_status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Business registration details
                registration_number TEXT,
                organization_type TEXT,
                incorporation_date TEXT,
                official_address TEXT,
                official_email TEXT,
                contact_person_designation TEXT,
                
                -- Document URLs
                registration_certificate_url TEXT,
                tax_identification_url TEXT,
                business_license_url TEXT,
                address_proof_url TEXT
            )
        ''')

        # Enhanced bookings table with detailed fields
        db.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                pilot_id INTEGER,
                editor_id INTEGER,
                referral_id INTEGER,
                
                -- Basic booking details
                service_type TEXT NOT NULL,
                location_details TEXT NOT NULL,
                preferred_date TEXT,
                preferred_time TEXT,
                
                -- Enhanced booking details
                special_requirements TEXT,
                voiceover_script TEXT,
                background_music_licensed BOOLEAN DEFAULT 0,
                branding_overlay BOOLEAN DEFAULT 0,
                multiple_revisions BOOLEAN DEFAULT 0,
                num_floors INTEGER DEFAULT 1,
                area_sqft INTEGER,
                
                -- Costing details
                base_cost REAL NOT NULL,
                floor_cost REAL DEFAULT 0,
                addon_cost REAL DEFAULT 0,
                final_cost REAL NOT NULL,
                
                -- Earnings breakdown
                pilot_earnings REAL DEFAULT 0,
                editor_earnings REAL DEFAULT 0,
                referral_earnings REAL DEFAULT 0,
                hmx_earnings REAL DEFAULT 0,
                gateway_fees REAL DEFAULT 0,
                
                status TEXT DEFAULT 'pending',
                payment_status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (client_id) REFERENCES users (id),
                FOREIGN KEY (pilot_id) REFERENCES users (id),
                FOREIGN KEY (editor_id) REFERENCES users (id),
                FOREIGN KEY (referral_id) REFERENCES users (id)
            )
        ''')

        # Enhanced pilots table
        db.execute('''
            CREATE TABLE IF NOT EXISTS pilots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                full_name TEXT,
                email TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'pending',
                
                -- Personal details
                date_of_birth TEXT,
                gender TEXT,
                address TEXT,
                
                -- License details
                government_id_proof TEXT,
                license_number TEXT,
                issuing_authority TEXT,
                license_issue_date TEXT,
                license_expiry_date TEXT,
                
                -- Drone details
                drone_model TEXT,
                drone_serial TEXT,
                drone_uin TEXT,
                drone_category TEXT,
                
                -- Experience
                total_flying_hours INTEGER,
                flight_records TEXT,
                cities TEXT,
                experience TEXT,
                equipment TEXT,
                portfolio_url TEXT,
                bank_account TEXT,
                
                -- Insurance
                insurance_policy TEXT,
                insurance_validity TEXT,
                
                -- Document URLs
                pilot_license_url TEXT,
                id_proof_url TEXT,
                training_certificate_url TEXT,
                photograph_url TEXT,
                insurance_certificate_url TEXT,
                
                admin_comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Enhanced editors table
        db.execute('''
            CREATE TABLE IF NOT EXISTS editors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                full_name TEXT,
                email TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'pending',
                
                -- Professional details
                role TEXT,
                years_experience TEXT,
                primary_skills TEXT,
                specialization TEXT,
                portfolio_url TEXT,
                time_zone TEXT,
                
                -- Documents
                government_id_url TEXT,
                tax_gst_number TEXT,
                
                admin_comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Enhanced referrals table
        db.execute('''
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'pending',
                
                -- Referral details
                location TEXT,
                experience TEXT,
                network_size TEXT,
                referral_strategy TEXT,
                social_media_links TEXT,
                referral_code TEXT UNIQUE,
                commission_rate REAL DEFAULT 12.5,
                total_referrals INTEGER DEFAULT 0,
                total_earnings REAL DEFAULT 0,
                
                admin_comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Enhanced payments table
        db.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                payment_method TEXT DEFAULT 'phonepe',
                merchant_transaction_id TEXT UNIQUE,
                phonepe_transaction_id TEXT,
                payment_gateway TEXT DEFAULT 'phonepe',
                gateway_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (booking_id) REFERENCES bookings (id)
            )
        ''')

        # Enhanced videos table
        db.execute('''
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                order_id INTEGER,
                client_id INTEGER,
                pilot_id INTEGER,
                editor_id INTEGER,
                
                drive_link TEXT,
                file_path TEXT,
                file_size INTEGER,
                duration INTEGER,
                status TEXT DEFAULT 'uploading',
                submission_type TEXT, -- 'pilot' or 'editor'
                
                -- Comments
                pilot_comments TEXT,
                editor_comments TEXT,
                admin_comments TEXT,
                
                submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (booking_id) REFERENCES bookings (id),
                FOREIGN KEY (client_id) REFERENCES users (id),
                FOREIGN KEY (pilot_id) REFERENCES users (id),
                FOREIGN KEY (editor_id) REFERENCES users (id)
            )
        ''')

        # Messages table
        db.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                booking_id INTEGER,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (sender_id) REFERENCES users (id),
                FOREIGN KEY (receiver_id) REFERENCES users (id),
                FOREIGN KEY (booking_id) REFERENCES bookings (id)
            )
        ''')

        db.commit()
        db.close()

def calculate_booking_cost(service_type, area_sqft, num_floors=1, special_requirements=None, 
                          voiceover_script=None, background_music_licensed=False, 
                          branding_overlay=False, multiple_revisions=False):
    """Calculate booking cost based on service type, area, and add-ons"""
    
    # Determine size category
    if area_sqft < 1000:
        size_category = '<1000'
    elif area_sqft <= 5000:
        size_category = '1000-5000'
    elif area_sqft <= 10000:
        size_category = '5000-10000'
    elif area_sqft <= 50000:
        size_category = '10000-50000'
    else:
        size_category = '50000+'
    
    # Get base cost from costing table
    if service_type not in COSTING_TABLE:
        # Default to retail store pricing if service type not found
        service_type = 'Retail Store / Showroom'
    
    base_cost = COSTING_TABLE[service_type][size_category]
    
    if base_cost == 'Custom Quote':
        return {
            'base_cost': 0,
            'floor_cost': 0,
            'addon_cost': 0,
            'final_cost': 0,
            'requires_custom_quote': True,
            'pilot_earnings': 0,
            'editor_earnings': 0,
            'referral_earnings': 0,
            'hmx_earnings': 0,
            'gateway_fees': 0
        }
    
    # Calculate floor cost (10% per additional floor)
    additional_floors = max(0, num_floors - 1)
    floor_cost = base_cost * 0.10 * additional_floors
    
    # Calculate addon costs
    addon_cost = 0
    if voiceover_script and voiceover_script.strip():
        addon_cost += base_cost * 0.15  # 15% for voiceover
    if background_music_licensed:
        addon_cost += base_cost * 0.10  # 10% for licensed music
    if branding_overlay:
        addon_cost += base_cost * 0.12  # 12% for branding overlay
    if multiple_revisions:
        addon_cost += base_cost * 0.08  # 8% for multiple revisions
    
    # Calculate final cost
    final_cost = base_cost + floor_cost + addon_cost
    
    # Calculate earnings distribution
    pilot_earnings = final_cost * (EARNINGS_DISTRIBUTION['pilot'] / 100)
    editor_earnings = final_cost * (EARNINGS_DISTRIBUTION['editor'] / 100)
    referral_earnings = final_cost * (EARNINGS_DISTRIBUTION['referral'] / 100)
    hmx_earnings = final_cost * (EARNINGS_DISTRIBUTION['hmx'] / 100)
    gateway_fees = final_cost * (EARNINGS_DISTRIBUTION['payment_gateway'] / 100)
    
    return {
        'base_cost': base_cost,
        'floor_cost': floor_cost,
        'addon_cost': addon_cost,
        'final_cost': final_cost,
        'requires_custom_quote': False,
        'pilot_earnings': pilot_earnings,
        'editor_earnings': editor_earnings,
        'referral_earnings': referral_earnings,
        'hmx_earnings': hmx_earnings,
        'gateway_fees': gateway_fees
    }

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Get user from database
            db = get_db()
            user = db.execute('SELECT * FROM users WHERE id = ?', (current_user_id,)).fetchone()
            db.close()
            
            if not user:
                return jsonify({'message': 'User not found'}), 401
                
            g.current_user = dict(user)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.current_user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['business_name', 'contact_name', 'email', 'phone', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if user already exists
        db = get_db()
        existing_user = db.execute('SELECT id FROM users WHERE email = ?', (data['email'],)).fetchone()
        if existing_user:
            db.close()
            return jsonify({'message': 'User already exists'}), 400
        
        # Hash password
        password_hash = generate_password_hash(data['password'])
        
        # Insert user
        cursor = db.execute('''
            INSERT INTO users (
                business_name, contact_name, email, phone, password_hash, role,
                registration_number, organization_type, incorporation_date,
                official_address, official_email, contact_person_designation,
                registration_certificate_url, tax_identification_url,
                business_license_url, address_proof_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['business_name'], data['contact_name'], data['email'], 
            data['phone'], password_hash, data.get('role', 'client'),
            data.get('registration_number'), data.get('organization_type'),
            data.get('incorporation_date'), data.get('official_address'),
            data.get('official_email'), data.get('contact_person_designation'),
            data.get('registration_certificate_url'), data.get('tax_identification_url'),
            data.get('business_license_url'), data.get('address_proof_url')
        ))
        
        user_id = cursor.lastrowid
        db.commit()
        db.close()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        db.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'name': user['contact_name'],
                'business_name': user['business_name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token():
    """Verify JWT token and return user info"""
    return jsonify(g.current_user), 200

# Enhanced Booking Routes
@app.route('/api/bookings', methods=['POST'])
@token_required
def create_booking():
    """Create a new booking with enhanced costing"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['service_type', 'location_details', 'area_sqft']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Calculate costs
        cost_breakdown = calculate_booking_cost(
            service_type=data['service_type'],
            area_sqft=int(data['area_sqft']),
            num_floors=int(data.get('num_floors', 1)),
            special_requirements=data.get('special_requirements'),
            voiceover_script=data.get('voiceover_script'),
            background_music_licensed=data.get('background_music_licensed', False),
            branding_overlay=data.get('branding_overlay', False),
            multiple_revisions=data.get('multiple_revisions', False)
        )
        
        if cost_breakdown['requires_custom_quote']:
            return jsonify({
                'message': 'Custom quote required for this project size',
                'requires_custom_quote': True
            }), 200
        
        # Insert booking
        db = get_db()
        cursor = db.execute('''
            INSERT INTO bookings (
                client_id, service_type, location_details, preferred_date, preferred_time,
                special_requirements, voiceover_script, background_music_licensed,
                branding_overlay, multiple_revisions, num_floors, area_sqft,
                base_cost, floor_cost, addon_cost, final_cost,
                pilot_earnings, editor_earnings, referral_earnings, hmx_earnings, gateway_fees
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            g.current_user['id'], data['service_type'], data['location_details'],
            data.get('preferred_date'), data.get('preferred_time'),
            data.get('special_requirements'), data.get('voiceover_script'),
            data.get('background_music_licensed', False), data.get('branding_overlay', False),
            data.get('multiple_revisions', False), int(data.get('num_floors', 1)),
            int(data['area_sqft']), cost_breakdown['base_cost'], cost_breakdown['floor_cost'],
            cost_breakdown['addon_cost'], cost_breakdown['final_cost'],
            cost_breakdown['pilot_earnings'], cost_breakdown['editor_earnings'],
            cost_breakdown['referral_earnings'], cost_breakdown['hmx_earnings'],
            cost_breakdown['gateway_fees']
        ))
        
        booking_id = cursor.lastrowid
        db.commit()
        db.close()
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id,
            'cost_breakdown': cost_breakdown
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to create booking: {str(e)}'}), 500

@app.route('/api/bookings', methods=['GET'])
@token_required
def get_bookings():
    """Get bookings for current user with full details"""
    try:
        db = get_db()
        
        if g.current_user['role'] == 'admin':
            # Admin sees all bookings
            bookings = db.execute('''
                SELECT b.*, 
                       c.contact_name as client_name, c.business_name, c.email as client_email, c.phone as client_phone,
                       p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                       e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                       r.name as referral_name, r.email as referral_email
                FROM bookings b
                LEFT JOIN users c ON b.client_id = c.id
                LEFT JOIN pilots p ON b.pilot_id = p.user_id
                LEFT JOIN editors e ON b.editor_id = e.user_id
                LEFT JOIN referrals r ON b.referral_id = r.user_id
                ORDER BY b.created_at DESC
            ''').fetchall()
        elif g.current_user['role'] == 'client':
            # Client sees their own bookings
            bookings = db.execute('''
                SELECT b.*, 
                       c.contact_name as client_name, c.business_name, c.email as client_email, c.phone as client_phone,
                       p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                       e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                       r.name as referral_name, r.email as referral_email
                FROM bookings b
                LEFT JOIN users c ON b.client_id = c.id
                LEFT JOIN pilots p ON b.pilot_id = p.user_id
                LEFT JOIN editors e ON b.editor_id = e.user_id
                LEFT JOIN referrals r ON b.referral_id = r.user_id
                WHERE b.client_id = ?
                ORDER BY b.created_at DESC
            ''', (g.current_user['id'],)).fetchall()
        elif g.current_user['role'] == 'pilot':
            # Pilot sees assigned bookings
            bookings = db.execute('''
                SELECT b.*, 
                       c.contact_name as client_name, c.business_name, c.email as client_email, c.phone as client_phone,
                       p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                       e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                       r.name as referral_name, r.email as referral_email
                FROM bookings b
                LEFT JOIN users c ON b.client_id = c.id
                LEFT JOIN pilots p ON b.pilot_id = p.user_id
                LEFT JOIN editors e ON b.editor_id = e.user_id
                LEFT JOIN referrals r ON b.referral_id = r.user_id
                WHERE b.pilot_id = (SELECT id FROM pilots WHERE user_id = ?)
                ORDER BY b.created_at DESC
            ''', (g.current_user['id'],)).fetchall()
        elif g.current_user['role'] == 'editor':
            # Editor sees assigned bookings
            bookings = db.execute('''
                SELECT b.*, 
                       c.contact_name as client_name, c.business_name, c.email as client_email, c.phone as client_phone,
                       p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                       e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                       r.name as referral_name, r.email as referral_email
                FROM bookings b
                LEFT JOIN users c ON b.client_id = c.id
                LEFT JOIN pilots p ON b.pilot_id = p.user_id
                LEFT JOIN editors e ON b.editor_id = e.user_id
                LEFT JOIN referrals r ON b.referral_id = r.user_id
                WHERE b.editor_id = (SELECT id FROM editors WHERE user_id = ?)
                ORDER BY b.created_at DESC
            ''', (g.current_user['id'],)).fetchall()
        else:
            bookings = []
        
        db.close()
        
        # Convert to list of dictionaries
        bookings_list = [dict(booking) for booking in bookings]
        
        return jsonify(bookings_list), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bookings: {str(e)}'}), 500

# Pilot Routes
@app.route('/api/pilots/register', methods=['POST'])
def register_pilot():
    """Register a new pilot"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if pilot already exists
        db = get_db()
        existing_pilot = db.execute('SELECT id FROM pilots WHERE email = ?', (data['email'],)).fetchone()
        if existing_pilot:
            db.close()
            return jsonify({'message': 'Pilot already exists'}), 400
        
        # Create user account first
        password_hash = generate_password_hash(data['password'])
        cursor = db.execute('''
            INSERT INTO users (contact_name, email, phone, password_hash, role, approval_status)
            VALUES (?, ?, ?, ?, 'pilot', 'pending')
        ''', (data['name'], data['email'], data['phone'], password_hash))
        
        user_id = cursor.lastrowid
        
        # Insert pilot details
        db.execute('''
            INSERT INTO pilots (
                user_id, name, full_name, email, phone, date_of_birth, gender, address,
                government_id_proof, license_number, issuing_authority, license_issue_date,
                license_expiry_date, drone_model, drone_serial, drone_uin, drone_category,
                total_flying_hours, flight_records, cities, experience, equipment,
                portfolio_url, bank_account, insurance_policy, insurance_validity,
                pilot_license_url, id_proof_url, training_certificate_url,
                photograph_url, insurance_certificate_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, data['name'], data.get('full_name'), data['email'], data['phone'],
            data.get('date_of_birth'), data.get('gender'), data.get('address'),
            data.get('government_id_proof'), data.get('license_number'),
            data.get('issuing_authority'), data.get('license_issue_date'),
            data.get('license_expiry_date'), data.get('drone_model'),
            data.get('drone_serial'), data.get('drone_uin'), data.get('drone_category'),
            data.get('total_flying_hours'), data.get('flight_records'),
            data.get('cities'), data.get('experience'), data.get('equipment'),
            data.get('portfolio_url'), data.get('bank_account'),
            data.get('insurance_policy'), data.get('insurance_validity'),
            data.get('pilot_license_url'), data.get('id_proof_url'),
            data.get('training_certificate_url'), data.get('photograph_url'),
            data.get('insurance_certificate_url')
        ))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Pilot application submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to register pilot: {str(e)}'}), 500

@app.route('/api/pilot/assigned-orders', methods=['GET'])
@token_required
def get_pilot_assigned_orders():
    """Get orders assigned to current pilot with full details"""
    try:
        if g.current_user['role'] != 'pilot':
            return jsonify({'message': 'Pilot access required'}), 403
        
        db = get_db()
        orders = db.execute('''
            SELECT b.*, 
                   c.contact_name as client_name, c.business_name, c.email as client_email, 
                   c.phone as client_phone, c.official_address as client_address,
                   p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                   e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                   r.name as referral_name, r.email as referral_email,
                   pay.status as payment_status, pay.amount as payment_amount
            FROM bookings b
            LEFT JOIN users c ON b.client_id = c.id
            LEFT JOIN pilots p ON b.pilot_id = p.user_id
            LEFT JOIN editors e ON b.editor_id = e.user_id
            LEFT JOIN referrals r ON b.referral_id = r.user_id
            LEFT JOIN payments pay ON b.id = pay.booking_id
            WHERE b.pilot_id = (SELECT id FROM pilots WHERE user_id = ?)
            ORDER BY b.created_at DESC
        ''', (g.current_user['id'],)).fetchall()
        
        db.close()
        
        return jsonify([dict(order) for order in orders]), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch assigned orders: {str(e)}'}), 500

@app.route('/api/editor/assigned-orders', methods=['GET'])
@token_required
def get_editor_assigned_orders():
    """Get orders assigned to current editor with full details"""
    try:
        if g.current_user['role'] != 'editor':
            return jsonify({'message': 'Editor access required'}), 403
        
        db = get_db()
        orders = db.execute('''
            SELECT b.*, 
                   c.contact_name as client_name, c.business_name, c.email as client_email, 
                   c.phone as client_phone, c.official_address as client_address,
                   p.name as pilot_name, p.email as pilot_email, p.phone as pilot_phone,
                   e.name as editor_name, e.email as editor_email, e.phone as editor_phone,
                   r.name as referral_name, r.email as referral_email,
                   pay.status as payment_status, pay.amount as payment_amount,
                   v.drive_link as raw_video_link
            FROM bookings b
            LEFT JOIN users c ON b.client_id = c.id
            LEFT JOIN pilots p ON b.pilot_id = p.user_id
            LEFT JOIN editors e ON b.editor_id = e.user_id
            LEFT JOIN referrals r ON b.referral_id = r.user_id
            LEFT JOIN payments pay ON b.id = pay.booking_id
            LEFT JOIN videos v ON b.id = v.booking_id AND v.submission_type = 'pilot'
            WHERE b.editor_id = (SELECT id FROM editors WHERE user_id = ?)
            ORDER BY b.created_at DESC
        ''', (g.current_user['id'],)).fetchall()
        
        db.close()
        
        return jsonify([dict(order) for order in orders]), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch assigned orders: {str(e)}'}), 500

# Editor Routes
@app.route('/api/editors/register', methods=['POST'])
def register_editor():
    """Register a new editor"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'phone', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if editor already exists
        db = get_db()
        existing_editor = db.execute('SELECT id FROM editors WHERE email = ?', (data['email'],)).fetchone()
        if existing_editor:
            db.close()
            return jsonify({'message': 'Editor already exists'}), 400
        
        # Create user account first
        password_hash = generate_password_hash(data['password'])
        cursor = db.execute('''
            INSERT INTO users (contact_name, email, phone, password_hash, role, approval_status)
            VALUES (?, ?, ?, ?, 'editor', 'pending')
        ''', (data['full_name'], data['email'], data['phone'], password_hash))
        
        user_id = cursor.lastrowid
        
        # Insert editor details
        db.execute('''
            INSERT INTO editors (
                user_id, name, full_name, email, phone, role, years_experience,
                primary_skills, specialization, portfolio_url, time_zone,
                government_id_url, tax_gst_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, data['full_name'], data['full_name'], data['email'], data['phone'],
            data.get('role'), data.get('years_experience'), data.get('primary_skills'),
            data.get('specialization'), data.get('portfolio_url'), data.get('time_zone'),
            data.get('government_id_url'), data.get('tax_gst_number')
        ))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Editor application submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to register editor: {str(e)}'}), 500

# Referral Routes
@app.route('/api/referrals/register', methods=['POST'])
def register_referral():
    """Register a new referral partner"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if referral already exists
        db = get_db()
        existing_referral = db.execute('SELECT id FROM referrals WHERE email = ?', (data['email'],)).fetchone()
        if existing_referral:
            db.close()
            return jsonify({'message': 'Referral partner already exists'}), 400
        
        # Create user account first
        password_hash = generate_password_hash(data.get('password', 'temp123'))
        cursor = db.execute('''
            INSERT INTO users (contact_name, email, phone, password_hash, role, approval_status)
            VALUES (?, ?, ?, ?, 'referral', 'pending')
        ''', (data['name'], data['email'], data['phone'], password_hash))
        
        user_id = cursor.lastrowid
        
        # Generate unique referral code
        referral_code = f"REF{user_id:04d}"
        
        # Insert referral details
        db.execute('''
            INSERT INTO referrals (
                user_id, name, email, phone, location, experience,
                network_size, referral_strategy, social_media_links, referral_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, data['name'], data['email'], data['phone'],
            data.get('location'), data.get('experience'),
            data.get('network_size'), data.get('referral_strategy'),
            data.get('social_media_links'), referral_code
        ))
        
        db.commit()
        db.close()
        
        # Generate JWT token for immediate login
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Referral application submitted successfully',
            'token': token,
            'referral_code': referral_code
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to register referral: {str(e)}'}), 500

# Video Submission Routes
@app.route('/api/pilot/video-submissions', methods=['POST'])
@token_required
def submit_pilot_video():
    """Submit video by pilot"""
    try:
        if g.current_user['role'] != 'pilot':
            return jsonify({'message': 'Pilot access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('order_id') or not data.get('drive_link'):
            return jsonify({'message': 'Order ID and drive link are required'}), 400
        
        db = get_db()
        
        # Insert video submission
        db.execute('''
            INSERT INTO videos (
                booking_id, order_id, client_id, pilot_id, drive_link,
                pilot_comments, submission_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'pilot', 'submitted')
        ''', (
            data['order_id'], data['order_id'], data.get('client_id'),
            g.current_user['id'], data['drive_link'], data.get('pilot_comments')
        ))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Video submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to submit video: {str(e)}'}), 500

@app.route('/api/editor/video-submissions', methods=['POST'])
@token_required
def submit_editor_video():
    """Submit edited video by editor"""
    try:
        if g.current_user['role'] != 'editor':
            return jsonify({'message': 'Editor access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('order_id') or not data.get('drive_link'):
            return jsonify({'message': 'Order ID and drive link are required'}), 400
        
        db = get_db()
        
        # Insert video submission
        db.execute('''
            INSERT INTO videos (
                booking_id, order_id, client_id, pilot_id, editor_id, drive_link,
                editor_comments, submission_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'editor', 'submitted')
        ''', (
            data['order_id'], data['order_id'], data.get('client_id'),
            data.get('pilot_id'), g.current_user['id'], data['drive_link'],
            data.get('editor_comments')
        ))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Edited video submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'message': f'Failed to submit edited video: {str(e)}'}), 500

# Admin Routes
@app.route('/api/admin/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def get_admin_stats():
    """Get dashboard statistics for admin"""
    try:
        db = get_db()
        
        # Get pending videos count
        pending_videos = db.execute('''
            SELECT COUNT(*) as count FROM videos WHERE status = 'submitted'
        ''').fetchone()['count']
        
        # Get active orders count
        active_orders = db.execute('''
            SELECT COUNT(*) as count FROM bookings WHERE status IN ('pending', 'in_progress', 'assigned')
        ''').fetchone()['count']
        
        # Get revenue for current month
        current_month = datetime.datetime.now().strftime('%Y-%m')
        revenue_mtd = db.execute('''
            SELECT COALESCE(SUM(final_cost), 0) as revenue 
            FROM bookings 
            WHERE status = 'completed' 
            AND strftime('%Y-%m', created_at) = ?
        ''', (current_month,)).fetchone()['revenue']
        
        # Get completed orders count
        completed_orders = db.execute('''
            SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'
        ''').fetchone()['count']
        
        db.close()
        
        return jsonify({
            'pendingVideos': pending_videos,
            'activeOrders': active_orders,
            'revenueMTD': revenue_mtd,
            'completedOrders': completed_orders
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch stats: {str(e)}'}), 500

@app.route('/api/admin/dashboard/activities', methods=['GET'])
@token_required
@admin_required
def get_admin_activities():
    """Get recent activities for admin dashboard"""
    try:
        # Return empty activities for now
        return jsonify([]), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch activities: {str(e)}'}), 500

# Payment Routes
@app.route('/api/payment/initiate', methods=['POST'])
@token_required
def initiate_payment():
    """Initiate PhonePe payment"""
    try:
        data = request.get_json()
        booking_id = data.get('booking_id')
        amount = data.get('amount')
        
        if not booking_id or not amount:
            return jsonify({'message': 'Booking ID and amount are required'}), 400
        
        # Get booking details
        db = get_db()
        booking = db.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,)).fetchone()
        if not booking:
            db.close()
            return jsonify({'message': 'Booking not found'}), 404
        
        # Get customer info
        customer = db.execute('SELECT * FROM users WHERE id = ?', (booking['client_id'],)).fetchone()
        
        customer_info = {
            'user_id': customer['id'],
            'phone': customer['phone'] or '1234567890'
        }
        
        # Create payment request
        payment_result = phonepe.create_payment_request(booking_id, amount, customer_info)
        
        if payment_result['success']:
            # Store payment record
            db.execute('''
                INSERT INTO payments (booking_id, amount, merchant_transaction_id, status)
                VALUES (?, ?, ?, 'pending')
            ''', (booking_id, amount, payment_result['merchant_transaction_id']))
            db.commit()
        
        db.close()
        
        return jsonify(payment_result), 200
        
    except Exception as e:
        return jsonify({'message': f'Payment initiation failed: {str(e)}'}), 500

@app.route('/api/payment/status/<merchant_transaction_id>', methods=['GET'])
@token_required
def check_payment_status(merchant_transaction_id):
    """Check payment status"""
    try:
        result = phonepe.check_payment_status(merchant_transaction_id)
        
        if result['success'] and result['status'] == 'COMPLETED':
            # Update payment and booking status
            db = get_db()
            db.execute('''
                UPDATE payments SET status = 'completed' 
                WHERE merchant_transaction_id = ?
            ''', (merchant_transaction_id,))
            
            # Get booking ID and update booking status
            payment = db.execute('''
                SELECT booking_id FROM payments WHERE merchant_transaction_id = ?
            ''', (merchant_transaction_id,)).fetchone()
            
            if payment:
                db.execute('''
                    UPDATE bookings SET payment_status = 'paid', status = 'in_progress'
                    WHERE id = ?
                ''', (payment['booking_id'],))
            
            db.commit()
            db.close()
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to check payment status: {str(e)}'}), 500

# Cost calculation endpoint
@app.route('/api/calculate-cost', methods=['POST'])
def calculate_cost():
    """Calculate booking cost based on parameters"""
    try:
        data = request.get_json()
        
        cost_breakdown = calculate_booking_cost(
            service_type=data.get('service_type'),
            area_sqft=int(data.get('area_sqft', 0)),
            num_floors=int(data.get('num_floors', 1)),
            special_requirements=data.get('special_requirements'),
            voiceover_script=data.get('voiceover_script'),
            background_music_licensed=data.get('background_music_licensed', False),
            branding_overlay=data.get('branding_overlay', False),
            multiple_revisions=data.get('multiple_revisions', False)
        )
        
        return jsonify(cost_breakdown), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to calculate cost: {str(e)}'}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.datetime.utcnow().isoformat()}), 200

if __name__ == '__main__':
    init_db()
    print("🚀 HMX FPV Tours Platform Starting...")
    print("📊 Enhanced booking system with detailed costing enabled")
    print("💰 Earnings distribution configured")
    print("🔗 Database initialized with enhanced schema")
    print("🌐 Server running on http://localhost:5000")
    app.run(debug=True, port=5000)
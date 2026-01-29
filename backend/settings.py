"""
Django settings for lms_backend project.
"""

from pathlib import Path
import os
import json
import django_on_heroku
import dj_database_url
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Read secret key from environment variable; support both DJANGO_SECRET_KEY and SECRET_KEY
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or os.getenv('SECRET_KEY') or 'your-default-secret-key'

# Debug mode - support DJANGO_DEBUG or DEBUG
_debug_env = os.getenv('DJANGO_DEBUG') if os.getenv('DJANGO_DEBUG') is not None else os.getenv('DEBUG', 'True')
DEBUG = str(_debug_env).lower() in ('1', 'true', 'yes')

# Allowed hosts - support DJANGO_ALLOWED_HOSTS (JSON list) or ALLOWED_HOSTS (comma-separated)
_allowed = os.getenv('DJANGO_ALLOWED_HOSTS') or os.getenv('ALLOWED_HOSTS')
if _allowed:
    try:
        ALLOWED_HOSTS = json.loads(_allowed)
    except Exception:
        # Fallback: split comma-separated string
        ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'whitenoise.runserver_nostatic',
    
    # Local apps
    'users',
    'courses',
    'payments',
    'dashboard',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    
    # Custom middleware
    'payments.middleware.DecimalSerializationMiddleware',
]

# URL configuration
ROOT_URLCONF = 'lms_backend.urls'

# Template configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI application
WSGI_APPLICATION = 'lms_backend.wsgi.application'

# Database configuration
_database_url = os.getenv('DATABASE_URL')
if _database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=_database_url,
            conn_max_age=600,
            ssl_require=os.getenv('DB_SSL', 'True').lower() in ('1', 'true', 'yes')
        )
    }
else:
    # Support individual DB_* env vars (used in this repo .env)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'db_lms'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django Heroku settings
django_on_heroku.settings(locals())

# CORS settings
CORS_ALLOWED_ORIGINS = json.loads(os.getenv('CORS_ALLOWED_ORIGINS', '[]'))
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = json.loads(os.getenv('CSRF_TRUSTED_ORIGINS', '[]'))

# Whitenoise configuration
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = DEBUG

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
        'payments': {
            'handlers': ['console'],
            'level': os.getenv('PAYMENTS_LOG_LEVEL', 'INFO'),
        },
    },
}

# Custom user model
AUTH_USER_MODEL = 'users.User'
# Tech Stack Summary for Cryptocurrency Trading Service

## Overview
This document summarizes the tech stack and deployment strategy for the Cryptocurrency Trading Service, an automated trading platform for BTC/USDT and LINK/USDT pairs on Binance. The stack supports real-time data processing, technical indicators (EMA55, RSI, DMI/ADX, SQZMOMENT), secure API key management, and user dashboards, as per the PRD dated July 4, 2025.

## Tech Stack Components

### Backend: Python with FastAPI
- **Version**: Python 3.12.10 with FastAPI 0.116.0
- **Purpose**: Handles real-time market data fetching (US-027), indicator calculations (US-028), signal generation (US-029), and trade execution (US-030).
- **Libraries**: 
  - CCXT: 4.4.93 - Binance API integration
  - TA-Lib: 0.6.4 - Technical analysis calculations
  - SQLAlchemy: 2.0.41 - Database ORM
  - Cryptography: 45.0.5 - Secure API key storage
  - PyJWT: 2.10.1 - Authentication
  - Uvicorn: 0.35.0 - ASGI server

### Database
- **PostgreSQL**: Latest LTS version
- **Purpose**: Stores market data, indicators, signals, and trade history
- **ORM**: SQLAlchemy with async support

### Deployment
- **Container**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

### Security
- **API Keys**: Encrypted at rest using Cryptography
- **Authentication**: JWT tokens
- **Rate Limiting**: Built-in FastAPI middleware

## Installation Steps

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install dependencies
pip install fastapi==0.116.0
pip install uvicorn==0.35.0
pip install ccxt==4.4.93
pip install sqlalchemy==2.0.41
pip install cryptography==45.0.5
pip install pyjwt==2.10.1
pip install TA-Lib==0.6.4
```

## Development Guidelines
- Follow PEP 8 style guide
- Use type hints
- Write unit tests
- Document API endpoints using OpenAPI
- Use async/await for I/O operations
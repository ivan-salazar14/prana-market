Cryptocurrency Trading Service: Automated Trading on Binance
1. Title and Overview
1.1 Document Title & Version

Title: Cryptocurrency Trading Service PRD
Version: 1.0
Date: July 4, 2025

1.2 Product Summary
The Cryptocurrency Trading Service automates trading on the Binance exchange for BTC/USDT and LINK/USDT pairs using a predefined strategy based on technical indicators such as EMA55, RSI, DMI/ADX, and SQZMOMENT. Users provide their Binance API keys to enable the service to execute trades on their behalf. The service includes features for risk management, performance tracking, and secure handling of user data.
2. User Personas
2.1 Key User Types

Experienced Cryptocurrency Traders: Users with a deep understanding of technical analysis who want to automate their trading to save time and improve consistency.
Novice Traders: Users with basic cryptocurrency knowledge who want to leverage a proven strategy without manually analyzing charts.
Swing Traders: Users focusing on short- to medium-term price movements on 4-hour and 1-hour timeframes.

2.2 Basic Persona Details

Experienced Traders: Typically have years of trading experience, understand complex strategies, and seek efficiency.
Novice Traders: New to trading, looking for an easy way to start with minimal effort.
Swing Traders: Focus on capturing price swings, often holding positions for days to weeks.

2.3 Role-based Access

Admin: Full access to manage the system, monitor performance, handle user support, and update strategies.
Registered User: Can sign up, complete KYC, connect Binance account, configure trading settings, view trades and performance, receive notifications, and contact support.
Guest: Can view general information about the service and sign up.

3. User Stories
US-001: User Registration

Description: As a guest, I want to create an account so that I can access the service.
Acceptance Criteria:
User can enter email and password.
User receives a confirmation email to verify their account.
Upon verification, user can log in.



US-002: KYC Verification

Description: As a registered user, I want to complete KYC verification so that I can enable trading features.
Acceptance Criteria:
User can submit personal information and upload ID documents.
The system sends the information for verification.
Once verified, the user's account is marked as KYC-compliant, and trading features are unlocked.



US-003: Connect Binance Account

Description: As a registered user with KYC completed, I want to connect my Binance account via API keys so that the service can trade on my behalf.
Acceptance Criteria:
User can enter their Binance API key and secret.
The system checks that the API keys have trading permissions but not withdrawal permissions.
If valid, the API keys are stored securely.
User can see the connection status.



US-004: Configure Trading Settings

Description: As a registered user with a connected Binance account, I want to configure my trading settings so that the service trades according to my preferences.
Acceptance Criteria:
User can set position size per trade.
User can choose which pairs to trade (BTC/USDT, LINK/USDT).
User can enable or disable automatedrice fields are compulsory (To prevent accidental deletion, this page is locked by default. If you need to make changes, please reach out to an admin through the XAI interface with your requested changes.) can edit this page.) can edit this page.) can edit this page.)


Acceptance Criteria:
User can set position size per trade.
User can choose which pairs to trade (BTC/USDT, LINK/USDT).
User can enable or disable automated trading.
Settings are saved and applied.



US-005: View Active Trades

Description: As a registered user, I want to view my active trades so that I can monitor their status.
Acceptance Criteria:
User can see a list of currently open positions with details like entry price, current price, profit/loss.
User can see the status of each trade.



US-006: View Trade History

Description: As a registered user, I want to view my trade history so that I can analyze past performance.
Acceptance Criteria:
User can see a list of past trades with details like entry and exit prices, profit/loss, date.
User can filter or sort the trade history.



US-007: View Performance Metrics

Description: As a registered user, I want to view performance metrics so that I can evaluate the strategy's effectiveness.
Acceptance Criteria:
User can see key metrics such as total profit/loss, win rate, average trade duration.
Metrics are updated periodically.



US-008: Receive Trade Notifications

Description: As a registered user, I want to receive notifications when trades are executed so that I can stay informed.
Acceptance Criteria:
User can choose notification methods (email, SMS, in-app).
Notifications are sent when a trade is opened or closed.
Notifications include relevant trade details.



US-009: Set Risk Per Trade

Description: As a registered user, I want to set the maximum risk per trade to control my exposure.
Acceptance Criteria:
User can set the maximum percentage of their balance to risk per trade.
The system calculates position size and stop-loss accordingly.



US-010: Contact Support

Description: As a registered user, I want to contact support for issues with my account or trades.
Acceptance Criteria:
User can access a support form or chat.
User can submit their issue.
Support team receives the request.



US-011: Monitor System Performance (Admin)

Description: As an admin, I want to monitor the system's performance to ensure it's running smoothly.
Acceptance Criteria:
Admin can view system metrics like uptime, active users, trade volume.
Admin can see alerts for issues.



US-012: Manage User Accounts (Admin)

Description: As an admin, I want to manage user accounts to handle support or compliance issues.
Acceptance Criteria:
Admin can view user list and statuses.
Admin can deactivate or reactivate accounts.
Admin can view user trade history.



US-013: User Authentication with 2FA

Description: As a user, I want to securely log in to my account using 2FA to protect my account.
Acceptance Criteria:
User can enable 2FA with an authenticator app.
Upon login, user must enter 2FA code in addition to password.



US-014: Secure API Key Storage

Description: As a user, I want my Binance API keys to be stored securely.
Acceptance Criteria:
API keys are encrypted before storage.
Only authorized system components can access decrypted keys.
Users can revoke or update API keys.



US-015: Handle Exchange Downtime

Description: As a user, I want the system to handle Binance API downtime gracefully.
Acceptance Criteria:
If API is down, system pauses trading and notifies user.
When API is back, trading resumes, and user is notified.



US-016: Handle Extreme Market Volatility

Description: As a user, I want the system to manage trades during extreme volatility.
Acceptance Criteria:
System monitors volatility and can pause trading if necessary.
User is notified of actions taken due to volatility.



US-017: Monitor Strategy Performance (Admin)

Description: As an admin, I want to monitor the strategy's performance across users.
Acceptance Criteria:
Admin can view aggregate performance metrics.
If performance drops, admin is alerted.



US-018: Provide Strategy Documentation

Description: As a user, I want to understand how the trading strategy works.
Acceptance Criteria:
Service provides detailed strategy documentation.
Users can access documentation within the application.



US-019: View Service Information (Guest)

Description: As a guest, I want to learn about the service before signing up.
Acceptance Criteria:
Guests can view a landing page with service information.
Guests can see demo dashboards or sample metrics.
Guests can sign up from the landing page.



US-020: Update Trading Strategy (Admin)

Description: As an admin, I want to update the trading strategy.
Acceptance Criteria:
Admin can upload a new strategy configuration.
System applies the new strategy to all users.
Users are notified of the update.



US-021: Pause/Resume Trading

Description: As a registered user, I want to pause or resume automated trading.
Acceptance Criteria:
User can toggle a switch to pause or resume trading.
When paused, no new trades are opened.
User receives confirmation.



US-022: Disconnect Binance Account

Description: As a registered user, I want to disconnect my Binance account.
Acceptance Criteria:
User can remove their API keys.
System stops trading on their behalf.
User can reconnect later.



US-023: Update Account Information

Description: As a registered user, I want to update my account information.
Acceptance Criteria:
User can change email address.
User can change password.
Changes are saved.



US-024: Reset Password

Description: As a user, I want to reset my password if I forget it.
Acceptance Criteria:
User can request a password reset via email.
User receives a reset link and can set a new password.


User Stories for Trading Strategy
US-025: View Strategy Details

Title: View Strategy Details
Description: As a user, I want to view the details of the trading strategy so that I can understand how it works and make informed decisions.
Acceptance Criteria:
The system provides a detailed description of the strategy, including the use of EMA55, RSI, DMI/ADX, and SQZMOMENT indicators.
The overview explains how signals are generated (e.g., trend confirmation, squeeze release) for BTC/USDT and LINK/USDT on 4H and 1H timeframes.
Accessible via a "Strategy Overview" section in the application.



US-026: Customize Strategy Parameters

Title: Customize Strategy Parameters
Description: As an advanced user, I want to adjust certain parameters of the strategy (e.g., indicator periods, thresholds) to tailor it to my preferences.
Acceptance Criteria:
Users can modify parameters like EMA period (default 55), RSI thresholds, or ADX levels.
Custom settings are saved and applied to signal generation.
Default parameters are available as a fallback option.



US-027: Fetch Real-Time Market Data

Title: Fetch Real-Time Market Data
Description: As a system, I need to fetch real-time market data from Binance for BTC/USDT and LINK/USDT on 4-hour and 1-hour timeframes to generate trading signals.
Acceptance Criteria:
The system retrieves price and volume data via Binance API for the specified pairs and timeframes.
Data updates occur at least every minute to ensure timely signals.
API rate limits and errors are managed without disrupting the strategy.



US-028: Calculate Technical Indicators

Title: Calculate Technical Indicators
Description: As a system, I need to calculate the required technical indicators (EMA55, RSI, DMI/ADX, SQZMOMENT) based on the fetched market data.
Acceptance Criteria:
EMA55, RSI, DMI/ADX, and SQZMOMENT are computed accurately for 4H and 1H timeframes.
Calculations update in real-time with new market data.
Historical indicator values are stored for analysis.



US-029: Generate Trading Signals

Title: Generate Trading Signals
Description: As a system, I need to generate trading signals based on the strategy logic, such as SQZMOMENT squeeze release, DMI/ADX trend confirmation, and price relation to EMA55.
Acceptance Criteria:
A bullish signal is generated when SQZMOMENT indicates a squeeze release, +DI crosses above -DI with rising ADX, and price is above EMA55.
A bearish signal is generated when opposite conditions are met (e.g., -DI crosses above +DI, price below EMA55).
Signals are validated across both 4H and 1H timeframes for consistency.



US-030: Execute Trades Automatically

Title: Execute Trades Automatically
Description: As a system, when a trading signal is generated, I need to execute the corresponding trade (buy/sell) on the user's Binance account via API.
Acceptance Criteria:
Buy orders are placed for bullish signals, and sell orders for bearish signals.
Trades execute only if the user’s balance and API permissions are sufficient.
Each trade is logged with timestamp, pair, and signal details.



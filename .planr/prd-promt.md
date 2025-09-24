You are senior product manager. your goal ist to create a comprehensive Product Requirements Document (PRD) based on the following instructions:

<prd_instructions>
Cryptocurrency Trading Service: Automated Trading on Binance
Core Problem
Manual trading on cryptocurrency exchanges like Binance is time-consuming, requires constant monitoring, and demands expertise in technical analysis. Traders often struggle to consistently apply complex strategies involving multiple indicators, leading to missed opportunities, emotional decision-making, or poor trade execution. This service addresses these pain points by automating trades based on a predefined strategy, reducing the need for constant user intervention and minimizing errors.
Target Users
The primary users are:

Experienced Cryptocurrency Traders: Individuals familiar with technical analysis who want to automate their trading to save time and improve consistency.
Novice Traders: Users with basic crypto knowledge who want to leverage a proven strategy without manually analyzing charts.
Swing Traders: Those focusing on 4-hour and 1-hour timeframes, seeking to capitalize on short- to medium-term price movements.

These users are likely comfortable with Binance and willing to provide API keys to enable automated trading.
Current Alternatives
Traders currently address this problem through:

Manual Trading: Monitoring charts and executing trades manually using platforms like Binance or TradingView.
Trading Bots: Platforms like 3Commas, Cryptohopper, or custom bots built with coding knowledge.
Signal Services: Subscription-based services providing trade signals via Telegram, email, or other channels.

Limitations of Current Alternatives

Manual Trading: Requires constant attention, leading to fatigue, missed opportunities, or emotional trading decisions.
Trading Bots: May not support the specific combination of indicators (EMA55, RSI, DMI/ADX, SQZMOMENT, etc.) or require advanced coding skills to customize.
Signal Services: Lack full automation, as users must manually execute trades, and signals may not align with the user’s preferred strategy or risk tolerance.

User Journey

Onboarding:

Users sign up for the service via a web or mobile interface.
They provide Binance API keys with trading permissions (securely stored and encrypted).
Users configure trading parameters, such as position size, risk tolerance, and optional strategy tweaks.


Strategy Configuration:

The service uses a predefined strategy based on EMA55, RSI, DMI/ADX, SQZMOMENT, support/resistance levels, chart patterns, Elliott Wave theory, and Fibonacci levels.
Users may adjust parameters (e.g., indicator thresholds) if customization is enabled.


Monitoring and Execution:

The service continuously monitors market data for BTC/USDT and LINK/USDT on 4-hour and 1-hour timeframes via the Binance API.
Trades are executed automatically when conditions are met, such as a SQZMOMENT squeeze release, DMI/ADX trend shift, and price being low relative to EMA55.


Reporting and Analysis:

Users access a dashboard to view trade history, performance metrics (e.g., win rate, profit/loss), and active positions.
Notifications (email, SMS, or in-app) alert users to executed trades or significant market events.


Risk Management:

Built-in features like stop-loss, take-profit, and trailing stops protect user funds.
Users can set maximum drawdown limits or pause trading during extreme market conditions.


Support and Maintenance:

Users can contact support for issues with API keys, trades, or strategy performance.
The service provides updates to the strategy based on market conditions or user feedback.



Key Features

Automated Trading: Executes trades on Binance for BTC/USDT and LINK/USDT based on the predefined strategy.
Risk Management: Includes stop-loss, take-profit, and trailing stop options to manage risk.
Performance Tracking: Provides detailed trade history, performance analytics, and portfolio overview.
Security: Ensures secure handling of Binance API keys with encryption and compliance with best practices.
Alert System: Sends notifications for executed trades, strategy triggers, or system issues.
Scalability: Supports multiple users and potential expansion to other trading pairs or exchanges.

Minimum Viable Product (MVP)
The MVP will focus on core functionality to validate the concept:

Automated Trading: Core feature to execute trades based on the strategy (EMA55, RSI, DMI/ADX, SQZMOMENT, etc.).
Basic Risk Management: Stop-loss and take-profit orders to protect user funds.
Performance Tracking: Basic dashboard with trade history and key metrics (e.g., total profit/loss).
Security: Secure API key storage and basic regulatory compliance.

Future Features

Strategy Customization: Allow users to adjust indicator parameters or add custom rules.
Advanced Analytics: Backtesting tools, detailed performance metrics, and predictive analytics.
Multi-Pair/Exchange Support: Expand to other trading pairs or exchanges (e.g., Ethereum, Coinbase).
Community Features: Forums or social features for users to share strategies and insights.

Integrations & Data

Binance API: Primary integration for fetching real-time market data (price, volume) and executing trades.
Potential Future Integrations: Additional data sources for enhanced indicators (e.g., on-chain data) or alternative exchanges.

Constraints

Regulatory Compliance: Must adhere to cryptocurrency regulations, including KYC/AML requirements in relevant jurisdictions.
Security: API keys and user data must be encrypted and protected against breaches.
Reliability: The service must maintain high uptime and handle real-time data processing without delays.
Performance: Trade execution must be fast to capitalize on market opportunities.
Scalability: The system should handle multiple users and high trading volumes.
User Education: Users need clear guidance on risks and strategy limitations.

Assumptions

Users have basic knowledge of cryptocurrency trading and understand associated risks.
Users have active Binance accounts and are comfortable providing API keys.
The strategy (combining EMA55, RSI, DMI/ADX, SQZMOMENT, etc.) has a positive expectancy based on historical backtesting.
Users are primarily swing traders focusing on 4-hour and 1-hour timeframes.

Edge Cases

Market Crashes/Extreme Volatility:

Issue: Rapid price movements may trigger multiple signals, leading to losses.
Solution: Implement robust risk management (e.g., wider stop-losses, trading pauses during high volatility).


Exchange Downtime:

Issue: Binance API outages could prevent trade execution.
Solution: Graceful error handling, user notifications, and temporary trading suspension.


API Key Issues:

Issue: Revoked or incorrect API keys could disrupt trading.
Solution: Detect invalid keys and prompt users to update them.


Strategy Performance Degradation:

Issue: The strategy may underperform in certain market conditions.
Solution: Monitor performance and alert users; offer strategy updates or backtesting tools.


Regulatory Changes:

Issue: New cryptocurrency regulations could impact the service.
Solution: Build adaptability into the platform and stay updated on legal requirements.


User Errors:

Issue: Incorrect API key input or misconfigured settings.
Solution: Implement input validation and clear error messages.



Strategy Details
The trading strategy is based on technical analysis and focuses on the following conditions:

Squeeze Momentum (SQZMOMENT): Identifies low-volatility periods (Bollinger Bands inside Keltner Channels) that precede breakouts. Trades are triggered when the squeeze releases, indicating potential price movement https://www.tradingview.com/script/G40dtEbK-Squeeze-Momentum-Indicator-Strategy-LazyBear-PineIndicators/.
DMI/ADX: Confirms trend direction and strength. A bullish signal occurs when +DI crosses above -DI with rising ADX; a bearish signal occurs when -DI crosses above +DI.
EMA55: Trades are considered when the price is low relative to the 55-period EMA, indicating potential oversold conditions or reversal points.
Additional Indicators: RSI, support/resistance levels, chart patterns, Elliott Wave theory, and Fibonacci levels provide further confirmation for trade entries and exits.

Example Trade Logic



Condition
Description
Action



SQZMOMENT Squeeze Release
Bollinger Bands move outside Keltner Channels, signaling volatility expansion.
Prepare for trade entry.


DMI/ADX Turn
+DI crosses above -DI with ADX rising above 20, indicating a bullish trend.
Confirm bullish signal.


Price vs. EMA55
Price is below or near EMA55, suggesting an oversold condition.
Enter long position.


RSI Confirmation
RSI below 30 (oversold) or showing divergence.
Strengthen buy signal.


Support/Resistance
Price near a support level (e.g., $12.50 for LINK/USDT).
Validate entry point.


Exit Conditions
Price reaches resistance, RSI overbought (>70), or stop-loss triggered.
Exit position.


Implementation Considerations

Data Processing: Real-time market data from Binance API must be processed efficiently to detect strategy signals.
Backtesting: The strategy should be backtested to validate performance across different market conditions.
User Interface: A simple, intuitive dashboard for monitoring trades and configuring settings.
Testing: Rigorous testing for edge cases, including simulated market crashes and API failures.

Citations

TradingView: Squeeze Momentum Indicator Strategy
ATAS: How to trade profitably with the Squeeze Momentum indicator
Simpler Trading: How to Read the Squeeze Indicator

</prd_instructions>

Follow these steps to create your PRD

1. Begin with a brief introduction stating the purpose of the document.

2. Organize your PRD into the following sections:

<prd_outline>
	# Title
	## 1. Title and Overview
	### 1.1 Document Title & Version
	### 1.2 Product Summary
	## 2. User Personas
	### 2.1 Key User Types
	### 2.2 Basic Persona Details
	### 2.3 Role-based Access	
		   - Briefly describe each user role (e.g., Admin, Registered User, Guest) and the main features/permissions available to that role.
	## 3. User Stories
</prd_outline>

3. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:
   - Use clear and concise language
   - Provide specific details and metrics where required
   - Maintain consistency throughout the document
   - Address all points mentioned in each section

4. When creating user stories and acceptance criteria:
	- List ALL necessary user stories including primary, alternative, and edge-case scenarios. 
	- Assign a unique requirement ID (e.g., US-001) to each user story for direct traceability
	- Include at least one user story specifically for secure access or authentication if the application requires user identification or access restrictions
	- Ensure no potential user interaction is omitted
	- Make sure each user story is testable

<user_story>
- ID
- Title
- Description
- Acceptance Criteria
</user_story>

5. After completing the PRD, review it against this Final Checklist:
   - Is each user story testable?
   - Are acceptance criteria clear and specific?
   - Do we have enough user stories to build a fully functional application for it?
   - Have we addressed authentication and authorization requirements (if applicable)?   

6. Format your PRD:
    - Maintain consistent formatting and numbering.
  	- Don't format text in markdown bold "**", we don't need this.
  	- List ALL User Stories in the output!
		- Format the PRD in valid Markdown, with no extraneous disclaimers.
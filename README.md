# Chrome Profile Manager - Automated Social Media Tool

A comprehensive web application for managing Chrome browser profiles and automating social media interactions, with workflows tailored for CoinMarketCap Community and Sosovalue (TokenBar).

## 🚀 Features

### Core Functionality
- **Chrome Profile Management**: Create, edit, delete, and launch Chrome browser profiles
- **Automated Social Media Posting**: Automated posting to CoinMarketCap community
- **Main Account Tagging for CMC Posts**: Optionally prepend `follow our channel at @mainaccount` ahead of the generated content.
- **AI Content Generation**: Uses GitHub Models (OpenAI `gpt-4.1-mini` via the GitHub Inference API) to draft post copy
- **Task Scheduling**: Automated task execution with configurable intervals
- **Cooldown Management**: Rate limiting to prevent account suspension
- **Logging System**: Comprehensive activity tracking and monitoring
- **SSL (Sosovalue) Image Posting**: Upload and post images (with optional title) to Sosovalue as part of the post body

### Key Components
- **Profile Manager**: Manage browser profiles with authentication details
- **Content Writer**: AI-powered content generation backed by the GitHub Models chat completion API
- **Task Manager**: Schedule and automate posting tasks
- **Prompt Management**: Organize and manage AI prompts by categories
- **Cooldown Manager**: Configure rate limits per computer/category
- **Log Viewer**: Monitor and analyze system activities

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Server**: Express.js REST API with Swagger documentation
- **Database**: PostgreSQL with Sequelize ORM
- **Automation**: Puppeteer for browser automation
- **AI Integration**: GitHub Models chat completions for content generation
- **Logging**: Pino logger with structured logging
- **Image Uploads**: Supports large payloads (up to 50MB) for SSL image posts

### Frontend (Next.js/React)
- **Framework**: Next.js 15 with React 18
- **State Management**: Redux Toolkit
- **Styling**: CSS modules and inline styles
- **Components**: Modular React components

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google Chrome browser
- GitHub Models access token (`GITHUB_TOKEN`)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd autotool
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd clientapp
   npm install
   cd ..
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   
   # GitHub Models (chat completions) token
   GITHUB_TOKEN=your_github_models_token
   ```

4. **Database Setup**
   ```sql
   -- Run the SQL migration files in order:
   -- sql/V2.0__create_promt_category_table.sql
   -- sql/V3.0__create_promt_table.sql
   -- sql/V4.0__create_cooldown_table.sql
   -- sql/V5.0__add_ssl_columns_to_emails.sql
   -- sql/V6.0__insert_ssl_test_record.sql
   ```

   A helper script (`node scripts/run-ssl-migration.js`) is available if you prefer to add the SSL columns programmatically.

## 🚀 Usage

### Starting the Application

1. **Start both server and client**
   ```bash
   npm start
   ```

2. **Or start individually**
   ```bash
   # Start backend server only
   npm run server
   
   # Start frontend client only
   npm run client
   ```

3. **Access the application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/api-docs

### Using the Application

1. **Profile Management**
   - Create Chrome profiles with authentication details
   - Set main profiles for priority operations
   - Launch profiles with specific URLs

2. **Content Generation**
   - Use the Content Writer to generate AI-powered content
   - Create and manage prompt categories
   - Organize prompts for different content types

3. **Task Automation**
   - Configure automated posting tasks
   - Set intervals for task execution
   - Monitor task execution through logs
   - **Tagging Main Account in CMC Posts**: In the Task Manager, enter a main account tag (e.g., `@mainaccount`). When posting to CMC, the system prepends `follow our channel at @mainaccount` ahead of the generated body.

4. **Cooldown Management**
   - Configure rate limits per computer and category
   - Prevent account suspension through intelligent timing
   - Sync cooldown settings across systems

5. **SSL (Sosovalue) Image Posting**
   - In the Task Manager, click "Show SSL Title Input" to reveal SSL options
   - Enter an optional title for your SSL post
   - Upload an image using the file input (supports PNG, JPG, etc.)
   - The image will be posted as part of the body content, immediately after the text
   - Click "DO POST SSL" to submit the post with both text and image
   - Large images are supported (up to 50MB payload)

## 📁 Project Structure

```
autotool/
├── automation/           # Browser automation scripts
│   ├── authCMC.js       # CoinMarketCap authentication
│   ├── cmcService.js    # CMC-specific services
│   └── launcher.js      # Profile launcher
├── clientapp/           # Next.js frontend application
│   ├── src/
│   │   ├── app/         # Next.js app router
│   │   ├── components/  # React components
│   │   ├── redux/       # State management
│   │   └── services/    # API services
├── models/              # Database models
├── routes/              # API routes
├── middlewares/         # Express middlewares
├── repositories/        # Data access layer
├── sql/                 # Database migrations
└── server.js           # Main server file
```

## 🔧 Configuration

### Database Models
- **ProfileEmail**: Chrome profile information
- **PromptCategory**: Content categories for organization
- **PromptInput**: AI prompts for content generation
- **CooldownState**: Rate limiting configuration

### API Endpoints
- `/api/profiles` - Profile management
- `/api/content` - Content generation
- `/api/promptCategory` - Category management
- `/api/prompts` - Prompt management
- `/api/task` - Task automation
- `/api/cooldown` - Cooldown configuration
- `/api/logs` - Log management

## 🤖 Automation Features

### Browser Automation
- Automated login to CoinMarketCap
- Account suspension detection
- Automated posting with AI-generated content
- Profile-specific browser sessions
- **SSL Image Posting**: Posts images as part of the Sosovalue post body

### Content Generation
- GitHub Models integration (OpenAI `gpt-4.1-mini`) for dynamic content
- Category-based prompt management
- Random content selection for variety
- Trending token integration

### Task Scheduling
- Configurable posting intervals
- Category rotation for content variety
- Cooldown enforcement (defaults to 30 minutes per PC/category, configurable in the Cooldown manager)
- Error handling and retry logic

## 📊 Monitoring and Logging

### Log Management
- Structured logging with Pino
- Log file rotation and management
- Real-time log viewing interface
- Pagination and filtering capabilities

### Activity Tracking
- Profile launch tracking
- Posting activity monitoring
- Error tracking and reporting
- Performance metrics

## 🔒 Security Considerations

- Environment variable configuration
- Database connection security
- API authentication (to be implemented)
- Rate limiting and cooldown management
- Secure credential storage

## 🚨 Important Notes

1. **Chrome Path**: Update the Chrome executable path in `automation/launcher.js` for your operating system
2. **Database**: Ensure PostgreSQL is running and accessible
3. **API Keys**: Secure your GitHub Models API token (`GITHUB_TOKEN`)
4. **Rate Limiting**: Configure appropriate cooldown periods to avoid account suspension
5. **Compliance**: Ensure compliance with platform terms of service
6. **Image Uploads**: Large images are supported for SSL posts (up to 50MB payload)

## 🐛 Troubleshooting

### Common Issues
1. **Chrome not launching**: Check Chrome executable path
2. **Database connection**: Verify PostgreSQL credentials
3. **API errors**: Verify that `GITHUB_TOKEN` is set and valid
4. **Port conflicts**: Ensure ports 8000 and 8001 are available
5. **Empty post content**: If your SSL post is missing text, check the browser and server logs for debugging output. Make sure the AI content generation is working and returning non-empty content. See the Task Manager console for details.

### Debug Mode
Enable debug logging by modifying the logger configuration in `middlewares/logger.js`

## 📝 License

This project is for educational and development purposes. Please ensure compliance with all applicable terms of service and regulations.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/api-docs`
3. Check the logs for error details
4. Create an issue in the repository

---

**Disclaimer**: This tool is designed for educational purposes. Users are responsible for complying with all applicable terms of service and regulations when using automated tools for social media interaction. 



@btcswift__
@snorterOffical
@BitCoin_Hyper
@PEPENODE_Token

# autotool
# autotool

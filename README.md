# AI-Powered Healthcare Search System

A full-stack web application that uses artificial intelligence to analyze symptoms and connect users with appropriate healthcare providers. Built with **MongoDB, Express.js, React, Node.js**, OpenAI API, and AWS - the complete MERN stack enhanced with AI capabilities.

## Features

- **AI-Powered Symptom Analysis**: Uses OpenAI's GPT API with LangChain for intelligent symptom interpretation
- **Smart Provider Matching**: Connects users with relevant healthcare providers based on AI analysis
- **Real-time Provider Data**: Integrates with NPI Registry API for up-to-date information
- **Location-based Search**: Find providers within customizable radius with distance calculations
- **In-Memory Caching**: Optimized performance with intelligent caching to reduce latency
- **Responsive Design**: Mobile-friendly React frontend with modern UI/UX
- **Production Ready**: Docker containerization, monitoring, and comprehensive error handling

## Tech Stack

### Backend

- **Node.js** runtime environment
- **Express.js** web framework
- **MongoDB** for user data and search history
- **OpenAI API** for symptom analysis
- **NPI Registry API** for provider data
- **LangChain** for AI prompt engineering
- **In-Memory Caching** for performance optimization
- **Winston** for logging
- **Jest** for testing

### Frontend

- **React** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API requests
- **React Toastify** for notifications

### DevOps & Deployment

- **Docker** & Docker Compose for containerization
- **Nginx** reverse proxy
- **AWS** deployment (EC2, S3, Auto Scaling)
- **GitHub Actions** for CI/CD

## Prerequisites

- Node.js 16+ and npm 8+
- MongoDB 4.4+
- OpenAI API key
- Docker (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-healthcare-search.git
cd ai-healthcare-search
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### 3. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
```

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string

### 4. Start Development Server

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run server  # Backend only
npm run client  # Frontend only
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.yml --profile monitoring up -d
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
ai-healthcare-search/
├── backend/
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── utils/           # Utility functions
│   ├── test/            # Test files
│   └── app.js           # Main application
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── App.jsx      # Main app component
│   └── public/          # Static files
├── logs/                # Application logs
├── docker-compose.yml   # Docker services
├── Dockerfile          # Container configuration
└── README.md           # This file
```

## Deployment

### AWS Deployment

1. **EC2 Setup**: Configure instances with Docker
2. **Load Balancer**: Application Load Balancer for traffic distribution
3. **Auto Scaling**: Automatic scaling based on demand
4. **S3 Storage**: Static assets and backups
5. **CloudWatch**: Monitoring and alerting

### Environment Variables

See `.env.example` for all required configuration options.

## Core Features Implementation

### AI Symptom Analysis

- **OpenAI GPT Integration**: Analyzes user symptoms using structured prompts
- **LangChain Framework**: Manages prompt routing and AI response processing
- **Medical Specialty Mapping**: Maps symptoms to relevant healthcare specialties
- **Urgency Assessment**: Determines urgency level (low, medium, high)

### Node.js/Express Backend

- **Express.js API**: RESTful API endpoints for search and user management
- **Real-time Data Processing**: Combines GPT outputs with NPI Registry data
- **Semantic Filtering**: Intelligent result filtering for better accuracy
- **Middleware Stack**: Authentication, rate limiting, and error handling

### Performance Optimization

- **In-Memory Caching**: Reduces API calls and improves response times
- **Semantic Filtering**: Intelligent result filtering for better accuracy
- **Lazy Loading**: Optimized frontend performance
- **Database Indexing**: Efficient MongoDB queries

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Future Enhancements

- Multi-language support
- Mobile app (React Native)
- Telemedicine integration
- Insurance verification API
- Appointment scheduling
- Provider reviews system
- Machine learning recommendations
- Voice input support
- Telehealth provider integration
- Prescription management
- .etc

## Medical Disclaimer

This application is for informational purposes only and does not constitute medical advice. Always consult with qualified healthcare professionals for medical diagnosis and treatment. In case of medical emergency, call 911 immediately.

# AI-Powered Healthcare Search Assistant

An AI-enhanced medical assistant that helps users describe symptoms in natural language and suggests relevant specialties and local providers, powered by OpenAI’s GPT, LangChain, and real-time data from the NPI Registry.

## Features

- AI symptom interpretation using OpenAI API
- Real-time provider search with the NPI Registry API
- LangChain-based prompt routing (mocked)
- Semantic filtering and result caching
- MongoDB user profiling
- Deployable to AWS with Docker

## Data Flow

User → React UI → /api/search → GPT & NPI APIs → Results → React UI
↓
MongoDB (for profiles)

## Tech Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI API, LangChain
- **Database**: MongoDB
- **Infrastructure**: Docker, AWS EC2/S3 (planned)

## Setup Instructions

### Prerequisites

- Node.js
- Docker + Docker Compose
- MongoDB
- OpenAI API key

### Clone and Run

```bash
git clone https://github.com/yourusername/ai-healthcare-search.git
cd ai-healthcare-search
docker-compose up --build
```

### .env Example

```env
OPENAI_API_KEY=your_openai_key
```

## Testing

```bash
cd backend
npm install
npm test
```

## Deployment

- Use AWS EC2 for backend container
- Store static React build on S3 with CloudFront
- Auto Scaling via EC2 ASG (future extension)

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with questions regarding medical conditions.

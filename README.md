# DocuQuery Frontend

A modern, responsive web interface for the DocuQuery intelligent document knowledge base system. Built with Next.js 14 and featuring a stunning glassmorphism design.

## Features

- **Document Upload**: Drag-and-drop or click to upload PDF, DOCX, and TXT files
- **AI Chat Interface**: Natural language conversations with your documents
- **Source Citations**: View exact document sources for every answer
- **Session Persistence**: Chat history is maintained across sessions
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glassmorphism UI**: Modern, premium visual design

## Screenshots

![DocuQuery Interface](./screenshots/main-interface.png)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **UI Utilities**: clsx

## Prerequisites

- Node.js 18+
- npm or yarn
- DocuQuery Backend running on `http://localhost:8000`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/murodbro/docu_query_frontend.git
cd docu_query_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
docu_query_frontend/
├── app/
│   ├── layout.tsx        # Root layout with global styles
│   ├── page.tsx          # Main chat interface
│   └── globals.css       # Global CSS styles
├── components/
│   ├── ChatInterface.tsx # Chat message display
│   ├── FileUpload.tsx    # Document upload component
│   ├── MessageInput.tsx  # User input component
│   └── SourceCard.tsx    # Citation display component
├── lib/
│   ├── api.ts            # API client configuration
│   └── types.ts          # TypeScript type definitions
├── public/               # Static assets
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## API Integration

The frontend communicates with the DocuQuery Backend API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/core/upload` | POST | Upload documents |
| `/core/query` | POST | Send questions to AI |
| `/core/sessions/{id}/history` | GET | Retrieve chat history |
| `/core/documents` | GET | List uploaded documents |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Related

- [DocuQuery Backend](https://github.com/murodbro/docu_query_backend) - FastAPI backend with RAG implementation

## License

MIT

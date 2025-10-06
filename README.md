# AI Recipe Assistant

A desktop application that provides a clean interface for generating personalized recipes using Ollama's AI models locally. Create delicious recipes based on available ingredients with dietary preferences and nutritional information, all without needing internet connectivity after initial setup.

## Features

* Fully offline AI recipe generation
* Ingredient-based recipe suggestions
* Dietary preference filtering (Vegetarian, Vegan, Keto, Gluten-free, etc.)
* Nutritional information display
* Multiple AI model support through Ollama
* Support for recipe images and ingredient photos
* Clean, modern interface with ingredient management
* Dark/Light mode support
* Real-time recipe generation
* Local data storage

## Prerequisites

1. Install Ollama:
   * Visit [Ollama's website](https://ollama.com/)
   * Download and install for your system
   * Open terminal and verify installation:
     ```bash
     ollama --version
     ```
   * Pull and run your first model (recommended for recipes):
     ```bash
     ollama pull llama3.2
     ollama run llama3.2
     ```
   * Check out my [blog post](https://medium.com/@mrmendoza-dev/offline-chatbots-with-ollama-52dd18f97933) for more information on how to get started with Ollama.

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-recipe-assistant.git
   cd ai-recipe-assistant
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_PORT=3030
   ```

## Running the Application

Start both frontend and backend servers:
```bash
npm start
```

This will run:
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:3030`

## Development

Run frontend only:
```bash
npm run dev
```

Run backend only:
```bash
npm run server
```

## Project Structure
```
offline-chatbot/
├── src/               # Frontend source code
├── server/            # Backend server code
└── public/            # Static assets
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_PORT | Backend server port | Yes |

## Tech Stack
* React + Vite
* Express.js
* Ollama API
* TailwindCSS
* Node.js

## Additional Resources
* [Ollama JS Documentation](https://github.com/ollama/ollama-js)
* [Ollama Model Library](https://ollama.com/library)

## License
MIT
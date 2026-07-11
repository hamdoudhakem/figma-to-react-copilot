Start by running

```bash
$env:OLLAMA_HOST="127.0.0.1:11434"; ollama run qwen2.5-coder:7b
ollama run qwen2.5-coder:7b
```

Then

```bash
uvicorn app.main:app --reload --port 8000
```

Finally

```bash
npm run dev
```

here is my structure :

```bash
app/
 core/
  config.py
  database.py
  llm.py
 models/
  db_models.py
 routers/
  analytics.py
  data_routes.py
  generator.py
 services/
  mcp_clients.py
 main.py
```

```bash
components/
  LiveCanvasView.tsx
app/
  layout.tsx
  page.tsx
  providers.tsx
  (main)/
    layout.tsx
    dashboard/page.tsx
    workspace/page.tsx
    library/
      page.tsx
      [id]/
       page.tsx
    history/page.tsx
```

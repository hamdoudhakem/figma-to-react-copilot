Start by running

```bash
$env:OLLAMA_HOST="127.0.0.1:11434"; ollama run qwen2.5-coder:7b
ollama run qwen2.5-coder:7b
```

Puis

```bash
uvicorn app.main:app --reload --port 8000
```

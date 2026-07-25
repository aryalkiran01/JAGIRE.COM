# Ollama AI Integration

Jagire uses **Ollama** as the default AI engine for all AI-powered features. The provider architecture remains intact, so you can switch to Gemini or OpenRouter later without changing business logic.

---

## 1. Install Ollama

### macOS / Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows

Download the installer from <https://ollama.com/download> and run it.

### Verify

```bash
ollama --version
```

---

## 2. Install Required Models

```bash
# Required
ollama pull llama3.2
ollama pull qwen3
ollama pull mxbai-embed-large

# Optional — only needed for reasoning tasks if you override OLLAMA_CHAT_MODEL
# ollama pull deepseek-r1
```

### Model sizes (approximate)

| Model                    | Size    | Used for                                                                     |
| ------------------------ | ------- | ---------------------------------------------------------------------------- |
| llama3.2                 | ~1.3 GB | Fast analysis: scoring, extraction, grammar, keywords, job matching          |
| qwen3                    | ~2 GB   | Generation: cover letters, interview questions, career suggestions, rankings |
| mxbai-embed-large        | ~670 MB | Semantic search embeddings                                                   |
| deepseek-r1 _(optional)_ | ~4.7 GB | Optional reasoning tasks — not required by default                           |

---

## 3. Which Model Each AI Module Uses

| AI Feature                     | Task ID                      | Model (default)   |
| ------------------------------ | ---------------------------- | ----------------- |
| Resume Analysis (upload scan)  | `resume-analysis`            | llama3.2          |
| ATS Score Detection            | `ats-score`                  | llama3.2          |
| Resume Grammar Analysis        | `grammar`                    | llama3.2          |
| Resume Summary                 | `resume-summary`             | llama3.2          |
| Skill Extraction               | `skill-extraction`           | llama3.2          |
| Experience Analysis            | `experience-analysis`        | llama3.2          |
| Education Analysis             | `education-analysis`         | llama3.2          |
| Resume Keyword Detection       | `keyword-detection`          | llama3.2          |
| Missing Skills Detection       | `missing-skills`             | llama3.2          |
| Job Matching                   | `job-matching`               | llama3.2          |
| Resume Strength & Weakness     | `strength-weakness`          | llama3.2          |
| AI Job Recommendation          | `job-recommendation`         | llama3.2          |
| Learning Recommendations       | `learning-recommendations`   | llama3.2          |
| LinkedIn Import                | `linkedin-import`            | llama3.2          |
| Resume Improvement Suggestions | `resume-improvement`         | qwen3             |
| Cover Letter Generation        | `cover-letter`               | qwen3             |
| Interview Question Generation  | `interview-questions`        | qwen3             |
| Candidate Ranking              | `candidate-ranking`          | qwen3             |
| AI Career Suggestions          | `career-suggestions`         | qwen3             |
| AI Hiring Recommendation       | `hiring-recommendation`      | qwen3             |
| Company Candidate Analysis     | `company-candidate-analysis` | qwen3             |
| Embeddings / Semantic Search   | `embedding`                  | mxbai-embed-large |

> **Note:** `deepseek-r1` is no longer the default for any task. To use it,
> set `OLLAMA_REASONING_MODEL=deepseek-r1` and then set
> `OLLAMA_CHAT_MODEL=deepseek-r1` for any task you want to route to it.

---

## 4. Environment Variables

Add these to your `.env` file:

```env
# Primary AI provider: ollama | gemini | openrouter
AI_PROVIDER=ollama

# Ollama connection
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3
OLLAMA_REASONING_MODEL=deepseek-r1
OLLAMA_FAST_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large
```

### Optional fallback providers

```env
GEMINI_API_KEY=
OPENROUTER_API_KEY=
```

When `AI_PROVIDER=ollama`, Ollama is tried first. If it fails with a transient error (timeout, 500, etc.), the system falls back to Gemini, then OpenRouter (if configured).

---

## 5. How to Switch Providers

Change `AI_PROVIDER` in `.env`:

```env
# Use Google Gemini as primary
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# Use OpenRouter as primary
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
```

The fallback order adjusts automatically:

| AI_PROVIDER  | 1st        | 2nd                     | 3rd                     |
| ------------ | ---------- | ----------------------- | ----------------------- |
| `ollama`     | Ollama     | Gemini (if key set)     | OpenRouter (if key set) |
| `gemini`     | Gemini     | OpenRouter (if key set) | Ollama                  |
| `openrouter` | OpenRouter | Gemini (if key set)     | Ollama                  |

No code changes required.

---

## 6. Troubleshooting

### Ollama is not running

```
Error: Ollama is not running at http://localhost:11434. Start it with: ollama serve
```

**Fix:** Start the Ollama daemon:

```bash
ollama serve
```

### Model not found

```
Error: Ollama model not found: qwen3. Run: ollama pull qwen3
```

**Fix:** Pull the missing model:

```bash
ollama pull qwen3
```

### Timeout

```
Error: AI transient error (408): Ollama request timed out
```

**Fix:** The default timeout is 120 seconds. For large models on slow hardware, increase it by setting `OLLAMA_TIMEOUT_MS` in the environment or reduce input size.

### Invalid JSON response

The system automatically retries once if the AI response fails Zod validation. If it still fails, check that the model supports JSON mode. All three default models (qwen3, deepseek-r1, llama3.2) support structured JSON output.

### Connection refused on remote host

If Ollama runs on a different machine, set `OLLAMA_HOST`:

```env
OLLAMA_HOST=http://192.168.1.100:11434
```

On the Ollama server, ensure it listens on all interfaces:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

---

## 7. Performance Tuning

### Keep models in memory

Ollama unloads models after 5 minutes of inactivity by default. To keep them hot:

```bash
OLLAMA_KEEP_ALIVE=-1 ollama serve
```

### GPU acceleration

Ollama auto-detects GPUs (CUDA, Metal, ROCm). Verify with:

```bash
ollama ps
```

The `SIZE` column shows whether the model is loaded on GPU or CPU.

### Parallel requests

Ollama supports multiple concurrent requests. For production, increase `OLLAMA_NUM_PARALLEL`:

```bash
OLLAMA_NUM_PARALLEL=4 ollama serve
```

### Reduce latency for fast tasks

Fast tasks (grammar, summary, keyword detection) use `llama3.2` which is small and fast. If you need even faster responses, set a smaller model:

```env
OLLAMA_FAST_MODEL=qwen3:0.6b
```

---

## 8. Adding New Models

### Step 1: Pull the model

```bash
ollama pull mistral
```

### Step 2: Assign it to a task category

Edit `src/integrations/ai/ollama-models.ts` and update the `TASK_TO_CATEGORY` mapping or the default constant:

```typescript
const DEFAULT_CHAT = "mistral"; // change from qwen3 to mistral
```

Or set it via environment variable without code changes:

```env
OLLAMA_CHAT_MODEL=mistral
```

### Step 3: Add a new task type (if needed)

Add the task name to `AITask` in `src/integrations/ai/types.ts`, then map it in `ollama-models.ts`.

---

## 9. Production Deployment Recommendations

### Run Ollama as a systemd service

```ini
# /etc/systemd/system/ollama.service
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/ollama serve
Environment=OLLAMA_HOST=0.0.0.0
Environment=OLLAMA_KEEP_ALIVE=-1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Pre-pull all models

```bash
ollama pull qwen3 deepseek-r1 llama3.2 mxbai-embed-large
```

### Resource requirements

| Setup              | RAM   | GPU VRAM | Notes                                          |
| ------------------ | ----- | -------- | ---------------------------------------------- |
| Minimum (CPU only) | 16 GB | —        | All models load but run slowly                 |
| Recommended        | 32 GB | 8 GB     | qwen3 + llama3.2 on GPU, deepseek-r1 partially |
| Optimal            | 64 GB | 24 GB    | All models fully on GPU                        |

### Security

- Bind Ollama to `127.0.0.1` unless behind a reverse proxy
- Use a firewall to restrict access to port 11434
- For remote access, use an SSH tunnel or a reverse proxy with authentication

### Monitoring

The AIService logs structured JSON to stdout with these fields:

- `provider` — which provider handled the request
- `model` — resolved model name (for Ollama)
- `latencyMs` — round-trip time
- `task` — which AI feature was called
- `attempt` — retry count
- `error` — error message on failure

Pipe these logs to your existing log aggregator (Datadog, CloudWatch, etc.) for monitoring.

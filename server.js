import express from "express";
import { execFile } from "child_process";
import fs from "fs";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;

/**
 * 🔥 Очередь (ограничение параллельности)
 */
let active = 0;
const MAX_JOBS = 2;
const queue = [];

function runNext() {
  if (queue.length === 0 || active >= MAX_JOBS) return;

  const job = queue.shift();
  active++;

  job(() => {
    active--;
    runNext();
  });
}

/**
 * 🚀 API
 */
app.post("/convert", async (req, res) => {
  const { inputUrl, format = "mp4", filters } = req.body;

  if (!inputUrl) {
    return res.status(400).json({ error: "inputUrl required" });
  }

  const id = randomUUID();
  const output = `/tmp/output-${id}.${format}`;

  queue.push((done) => {
    const args = ["-i", inputUrl];

    // фильтры (например crop)
    if (filters) {
      args.push("-vf", filters);
    }

    // если аудио
    if (format === "mp3") {
      args.push("-vn", "-acodec", "libmp3lame");
    }

    args.push("-y", output);

    console.log("🚀 Start job:", id);

    execFile("ffmpeg", args, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ FFmpeg error:", stderr);
        done();
        return res.status(500).json({ error: stderr });
      }

      console.log("✅ Done:", id);

      res.sendFile(output, () => {
        try {
          fs.unlinkSync(output);
        } catch (e) {
          console.warn("⚠️ cleanup error:", e.message);
        }
        done();
      });
    });
  });

  runNext();
});

/**
 * ❤️ healthcheck (очень полезно для Zeabur)
 */
app.get("/", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log("🔥 FFmpeg API running on port", PORT);
});

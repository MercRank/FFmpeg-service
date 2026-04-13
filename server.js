import express from "express";
import { execFile } from "child_process";
import fs from "fs";

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;

app.post("/convert", async (req, res) => {
  const { inputUrl, format = "mp4", filters } = req.body;

  if (!inputUrl) {
    return res.status(400).json({ error: "inputUrl required" });
  }

  const output = `/tmp/output.${format}`;

  const args = ["-i", inputUrl];

  // 👉 если есть фильтры (например crop)
  if (filters) {
    args.push("-vf", filters);
  }

  // 👉 если это видео — не режем звук
  if (format === "mp3") {
    args.push("-vn", "-acodec", "libmp3lame");
  }

  args.push("-y", output);

  execFile("ffmpeg", args, (error) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.sendFile(output, () => {
      fs.unlinkSync(output);
    });
  });
});

app.listen(PORT, () => {
  console.log("FFmpeg API running on port", PORT);
});

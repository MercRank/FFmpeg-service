import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;

app.post("/convert", async (req, res) => {
  const { inputUrl, format = "mp3" } = req.body;

  if (!inputUrl) {
    return res.status(400).json({ error: "inputUrl required" });
  }

  const output = `/tmp/output.${format}`;

  const cmd = `ffmpeg -i "${inputUrl}" -vn -acodec libmp3lame "${output}"`;

  exec(cmd, (error) => {
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

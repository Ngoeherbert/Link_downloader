import express, { json } from "express";
import { spawn } from "child_process";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "https://link-downloader-gilt.vercel.app", // Your frontend URL
    methods: ["GET", "POST"],
    exposedHeaders: ["Content-Disposition"], // Important for downloads
  }),
);
app.use(json());

const PORT = 5000;

app.get('/', (req, res) => {
  res.send('server is running')
})

// Metadata & Quality Options Route
app.post("/api/get-info", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  // Use -F would list formats, but -j gives us the data we need to parse
  const ytDlp = spawn("yt-dlp", ["-j", "--no-warnings", url]);

  let output = "";
  ytDlp.stdout.on("data", (data) => (output += data));

  ytDlp.on("close", (code) => {
    if (code !== 0)
      return res.status(500).json({ error: "Failed to fetch info" });

    try {
      const videoData = JSON.parse(output);

      // Map formats to get a clean list of resolutions
      // We filter to ensure we have a resolution (vcodec != none)
      const formats = videoData.formats
        .filter((f) => f.vcodec !== "none" && f.height !== null)
        .map((f) => ({
          id: f.format_id,
          ext: f.ext,
          resolution: f.height + "p",
          filesize: f.filesize
            ? (f.filesize / (1024 * 1024)).toFixed(1) + " MB"
            : f.filesize_approx
              ? (f.filesize_approx / (1024 * 1024)).toFixed(1) + " MB"
              : "Unknown Size",
          height: f.height, // used for sorting
        }));

      // Remove duplicates (keep the best one for each resolution)
      const uniqueFormats = Array.from(
        new Map(formats.map((item) => [item.resolution, item])).values(),
      ).sort((a, b) => b.height - a.height); // Sort 1080p, 720p, etc.

      res.json({
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration_string,
        formats: uniqueFormats,
      });
    } catch (e) {
      res.status(500).json({ error: "Error processing video data" });
    }
  });
});

// Finalized MP4 Streaming Route
app.get("/api/download", (req, res) => {
  const { url, title, formatId } = req.query;
  const filename = `${title || "video"}.mp4`.replace(/[^\w\s.-]/gi, "");

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "video/mp4");

  // The secret sauce: formatId + bestaudio
  // This ensures even if you pick "137" (1080p video only), it adds sound.
  const ytDlp = spawn("yt-dlp", [
    "-f",
    `${formatId}+bestaudio[ext=m4a]/bestvideo+bestaudio/best`,
    "--merge-output-format",
    "mp4",
    "-o",
    "-",
    "--downloader",
    "ffmpeg",
    "--downloader-args",
    "ffmpeg:-movflags frag_keyframe+empty_moov",
    url,
  ]);

  ytDlp.stdout.pipe(res);
  ytDlp.on("close", () => res.end());
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`),
);

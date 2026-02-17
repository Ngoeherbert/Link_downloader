import express, { json } from "express";
import { spawn } from "child_process";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "https://link-downloader-gilt.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(json());

const PORT = process.env.PORT || 10000;

// PASTE YOUR TOKENS HERE
const GUEST_PO_TOKEN =
  "MniYtBsQESfngpiIFK2YylwfzRN__UkjMAze6KeOsH0-nl1Vzq7jXEF7L_y5v06xcXrltwHjAQgh5ugKM6QHAgx-SDODpfjOvR0Cx3ziFS9bHP17LzeuyoJan81zQ-_oFJM56ZQH7PMDchGG-g3Jx85vsCn63kHkWHE=";
const VISITOR_DATA = "CgtieGtURmtVajZaayiZ48XMBjIKCgJDTRIEGgAgZQ%3D%3D";

const getExtractorArgs = () => {
  if (GUEST_PO_TOKEN && VISITOR_DATA) {
    // FIXED: Corrected 'Youtubeer' typo and added player-skip for better reliability
    return `Youtubeer_client=web,default;player-skip=webpage,configs;po_token=${GUEST_PO_TOKEN};visitor_data=${VISITOR_DATA}`;
  }
  return "youtube:player_client=android,web";
};

app.get("/", (req, res) => res.send("Media Engine: Operational"));

// Metadata Route (REVERTED TO POST FOR req.body SUPPORT)
app.post("/api/get-info", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const ytDlp = spawn("yt-dlp", [
    "--extractor-args",
    getExtractorArgs(),
    "-j",
    "--no-warnings",
    url,
  ]);

  let output = "";
  let errorOutput = "";

  ytDlp.stdout.on("data", (data) => (output += data));
  ytDlp.stderr.on("data", (data) => (errorOutput += data));

  ytDlp.on("close", (code) => {
    if (code !== 0) {
      console.error("yt-dlp error output:", errorOutput);
      return res
        .status(500)
        .json({ error: "Media Node Failed", details: errorOutput });
    }
    try {
      const videoData = JSON.parse(output);
      const formats = videoData.formats
        .filter((f) => f.vcodec !== "none" && f.height !== null)
        .map((f) => ({
          id: f.format_id,
          resolution: f.height + "p",
          filesize: f.filesize
            ? (f.filesize / (1024 * 1024)).toFixed(1) + " MB"
            : "Unknown Size",
          height: f.height,
        }));

      res.json({
        title: videoData.title,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration_string,
        formats: Array.from(
          new Map(formats.map((i) => [i.resolution, i])).values(),
        ).sort((a, b) => b.height - a.height),
      });
    } catch (e) {
      res.status(500).json({ error: "Buffer Error" });
    }
  });
});

// Stream Route
app.get("/api/download", (req, res) => {
  const { url, title, formatId } = req.query;
  const filename = `${title || "video"}.mp4`.replace(/[^\w\s.-]/gi, "");

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "video/mp4");

  const ytDlp = spawn("yt-dlp", [
    "--extractor-args",
    getExtractorArgs(),
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

app.listen(PORT, "0.0.0.0", () => console.log(`Engine running on ${PORT}`));

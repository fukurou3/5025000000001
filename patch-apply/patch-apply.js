const express = require("express");
const git = require("simple-git")();
const notifier = require("node-notifier");
const { execSync } = require("child_process");

const app = express();
app.use(express.text({ type: "*/*", limit: "2mb" }));

// --- 通知で OK / Skip を選ばせる ---
function ask(diffHead) {
  return new Promise(res => {
    notifier.notify(
      {
        title: "DiffSnatcher",
        message: "新しい差分を適用しますか？\n" + diffHead,
        actions: ["Apply", "Skip"],
        closeLabel: "Skip",
        timeout: 10
      },
      (err, resp) => res(resp === "apply")
    );
  });
}

app.post("/", async (req, res) => {
  const diff = req.body;
  const head = diff.split("\n").slice(0, 5).join("\n");
  const ok = await ask(head);
  if (!ok) return res.sendStatus(204);     // Skip したとき
  try {
    await git.raw(["apply", "--reject"], diff);
    try { execSync("npm run lint --silent", { stdio: "inherit" }); } catch {}
    console.log("✅ Patch applied");
    res.send("applied");
  } catch (e) {
    await git.reset(["--hard"]);
    console.error("❌ Patch failed, reverted");
    res.status(500).send("fail");
  }
});

app.listen(3456, () => console.log("📡 patch-apply.js listening on 3456"));

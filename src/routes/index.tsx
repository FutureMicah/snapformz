import { useState } from "react";
import { toPng } from "html-to-image";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, FileImage, LockKeyhole, LoaderCircle, RotateCcw, Send, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Review Capture | Full-page screenshot submissions" },
      { name: "description", content: "Capture the full page and securely submit it for review." },
      { property: "og:title", content: "Review Capture" },
      { property: "og:description", content: "Capture the full page and securely submit it for review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes] = useState("");
  const [endpoint, setEndpoint] = useState("https://httpbin.org/post");
  const [apiKey, setApiKey] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<"idle" | "capturing" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [lastSubmitted, setLastSubmitted] = useState("");

  const isProcessing = status === "capturing" || status === "uploading";

  async function captureAndSubmit() {
    setErrorMessage("");
    setStatus("capturing");

    try {
      const destination = endpoint.trim();
      const destinationUrl = new URL(destination);
      if (destinationUrl.protocol !== "https:") {
        throw new Error("Use an HTTPS endpoint to transmit screenshots securely.");
      }

      const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const dataUrl = await toPng(document.documentElement, {
        cacheBust: true,
        pixelRatio: 1,
        width: pageWidth,
        height: pageHeight,
        canvasWidth: pageWidth,
        canvasHeight: pageHeight,
        skipFonts: true,
      });

      setPreview(dataUrl);
      setStatus("uploading");
      const response = await fetch(destination, {
        method: "POST",
        headers: apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {},
        body: (() => {
          const formData = new FormData();
          const binary = atob(dataUrl.split(",")[1] ?? "");
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
          formData.append("screenshot", new Blob([bytes], { type: "image/png" }), "review-capture.png");
          if (includeMetadata) {
            formData.append("pageUrl", window.location.href);
            formData.append("timestamp", new Date().toISOString());
            formData.append("reviewer", reviewer.trim());
            formData.append("notes", notes.trim());
            formData.append("userAgent", navigator.userAgent);
          }
          return formData;
        })(),
      });

      if (!response.ok) throw new Error(`The review endpoint returned ${response.status}.`);
      setLastSubmitted(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setStatus("success");
      toast.success("Screenshot submitted successfully");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The screenshot could not be submitted.");
      setStatus("error");
      toast.error("Submission failed", { description: "Check the endpoint and try again." });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileImage className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">Review Capture</p>
              <p className="text-xs text-muted-foreground">Full-page review submissions</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings((open) => !open)} aria-expanded={showSettings}>
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Ready for your review
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Capture the complete page. Send it for review.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Create a high-quality snapshot of everything on this page, then securely deliver it to your review system.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_12px_40px_-24px_var(--shadow-color)] sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="text-sm font-semibold">Submission details</p>
                <p className="mt-1 text-sm text-muted-foreground">Add context for the person reviewing this capture.</p>
              </div>
              <div className="hidden size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground sm:flex"><Send className="size-4" /></div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Reviewer name or ID <span className="font-normal text-muted-foreground">(optional)</span>
                <Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="e.g. Jordan Lee" />
              </label>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Review notes <span className="font-normal text-muted-foreground">(optional)</span>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any context the reviewer should know..." rows={4} />
              </label>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/50 p-4">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Include page details</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Adds the current URL, timestamp, browser, and your notes.</p>
                </div>
              </div>
              <Switch checked={includeMetadata} onCheckedChange={setIncludeMetadata} aria-label="Include page details" />
            </div>

            <div className="mt-7 border-t border-border pt-6">
              <Button className="h-12 w-full text-sm shadow-sm" size="lg" onClick={captureAndSubmit} disabled={isProcessing || !endpoint.trim()}>
                {isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <FileImage className="size-4" />}
                {status === "capturing" ? "Capturing full page..." : status === "uploading" ? "Uploading securely..." : "Capture full page & submit"}
              </Button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Transmission is sent over HTTPS</div>
            </div>
          </section>

          <aside className="space-y-6">
            {showSettings && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_-24px_var(--shadow-color)]">
                <div className="flex items-center gap-2"><Settings2 className="size-4 text-primary" /><p className="text-sm font-semibold">Upload destination</p></div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Use an HTTPS endpoint that accepts a multipart form upload.</p>
                <label className="mt-4 grid gap-2 text-xs font-medium">Endpoint URL<Input type="url" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://your-review-system.com/upload" /></label>
                <label className="mt-4 grid gap-2 text-xs font-medium">Bearer token <span className="font-normal text-muted-foreground">(optional)</span><Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Only used for this submission" /></label>
                <p className="mt-3 text-[11px] leading-4 text-muted-foreground">Credentials stay in this browser session and are never saved by this tool.</p>
              </section>
            )}

            {status === "success" && preview ? (
              <section className="overflow-hidden rounded-2xl border border-success/30 bg-success/5">
                <div className="flex items-start gap-3 p-5"><CheckCircle2 className="mt-0.5 size-5 text-success" /><div><p className="text-sm font-semibold text-success-foreground">Capture submitted</p><p className="mt-1 text-xs text-muted-foreground">Sent at {lastSubmitted}</p></div></div>
                <img src={preview} alt="Preview of the submitted full-page capture" className="max-h-72 w-full border-t border-success/20 object-cover object-top" />
                <div className="flex items-center justify-between gap-3 p-4"><span className="text-xs text-muted-foreground">PNG preview</span><Button variant="outline" size="sm" onClick={() => { setStatus("idle"); setPreview(""); }}><RotateCcw className="size-3.5" /> New capture</Button></div>
              </section>
            ) : status === "error" ? (
              <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"><div className="flex gap-3"><AlertCircle className="mt-0.5 size-5 text-destructive" /><div><p className="text-sm font-semibold">Submission needs attention</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{errorMessage}</p></div></div><Button variant="outline" size="sm" className="mt-4" onClick={captureAndSubmit}><RotateCcw className="size-3.5" /> Try again</Button></section>
            ) : (
              <section className="rounded-2xl border border-border bg-secondary/40 p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-background text-primary shadow-sm"><ShieldCheck className="size-5" /></div><p className="mt-5 text-sm font-semibold">Built for calm, careful review</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Your capture includes the full scrollable page, not only what is visible on screen.</p><div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground"><ArrowUpRight className="size-3.5 text-primary" /> Ready when you are</div></section>
            )}
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/70 px-5 py-6 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Review Capture</span><span className="flex items-center gap-1.5"><LockKeyhole className="size-3.5" /> Screenshots are transmitted securely over HTTPS.</span></div></footer>
    </div>
  );
}

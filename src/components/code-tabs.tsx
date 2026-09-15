"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import php from "highlight.js/lib/languages/php";
import go from "highlight.js/lib/languages/go";
import ruby from "highlight.js/lib/languages/ruby";
import java from "highlight.js/lib/languages/java";
import csharp from "highlight.js/lib/languages/csharp";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("php", php);
hljs.registerLanguage("go", go);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("java", java);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("json", json);

const EVT = "axdox-lang";

const HLJS: Record<string, string> = {
  "cURL": "bash",
  "Next.js": "typescript",
  "Node.js": "javascript",
  "Node.js (Express)": "javascript",
  "Python": "python",
  "Python (Flask)": "python",
  "PHP": "php",
  "Go": "go",
  "Ruby": "ruby",
  "Java": "java",
  "C#": "csharp",
  "C# (.NET)": "csharp",
  "JSON": "json",
};

export function CodeTabs({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const apply = (lang: string | null) => {
      if (!lang) return;
      const i = tabs.findIndex((t) => t.label === lang);
      if (i >= 0) setActive(i);
    };
    try { apply(localStorage.getItem(EVT)); } catch {}
    const handler = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, [tabs]);

  const choose = (i: number) => {
    setActive(i);
    try { localStorage.setItem(EVT, tabs[i].label); } catch {}
    window.dispatchEvent(new CustomEvent(EVT, { detail: tabs[i].label }));
  };

  const current = tabs[active] ?? tabs[0];

  const html = useMemo(() => {
    const lang = HLJS[current.label] ?? "plaintext";
    try {
      return hljs.highlight(current.code, { language: lang, ignoreIllegals: true }).value;
    } catch {
      return current.code.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    }
  }, [current]);

  return (
    <div className="my-4 overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-muted/60 pr-2">
        <div className="flex overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => choose(i)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                i === active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(current.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-card p-4 text-[13px] leading-relaxed">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

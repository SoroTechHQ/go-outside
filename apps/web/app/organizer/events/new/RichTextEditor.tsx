"use client";

import { useRef, useCallback, useEffect } from "react";
import {
  TextB,
  TextItalic,
  ListBullets,
  ListNumbers,
  LinkSimple,
  TextUnderline,
} from "@phosphor-icons/react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "Describe your event…", maxLength }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []); // only sync initial value on mount

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  function handleInput() {
    if (!isComposing.current && editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (maxLength) {
        const text = editorRef.current.innerText;
        if (text.length > maxLength) return;
      }
      onChange(html);
    }
  }

  function insertLink() {
    const url = window.prompt("Paste a URL");
    if (url) exec("createLink", url.startsWith("http") ? url : `https://${url}`);
  }

  const textLen = editorRef.current?.innerText.length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition focus-within:border-[var(--brand)]/50 focus-within:ring-2 focus-within:ring-[var(--brand)]/10">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1.5">
        <ToolbarBtn title="Bold (⌘B)" onClick={() => exec("bold")}><TextB size={14} weight="bold" /></ToolbarBtn>
        <ToolbarBtn title="Italic (⌘I)" onClick={() => exec("italic")}><TextItalic size={14} /></ToolbarBtn>
        <ToolbarBtn title="Underline (⌘U)" onClick={() => exec("underline")}><TextUnderline size={14} /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
        <ToolbarBtn title="Bullet list" onClick={() => exec("insertUnorderedList")}><ListBullets size={14} /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => exec("insertOrderedList")}><ListNumbers size={14} /></ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
        <ToolbarBtn title="Insert link" onClick={insertLink}><LinkSimple size={14} /></ToolbarBtn>
      </div>

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
          className="prose prose-sm min-h-[140px] max-w-none px-4 py-3 text-[13px] leading-relaxed text-[var(--text-primary)] focus:outline-none [&_a]:text-[var(--brand)] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        />
        {!value && (
          <p className="pointer-events-none absolute left-4 top-3 text-[13px] text-[var(--text-tertiary)]">
            {placeholder}
          </p>
        )}
      </div>

      {maxLength && (
        <div className="flex justify-end border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{textLen}/{maxLength}</span>
        </div>
      )}
    </div>
  );
}

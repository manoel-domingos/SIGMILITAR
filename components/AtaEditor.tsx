"use client";

/**
 * AtaEditor — campo único de escrita da ATA com negrito em tempo real.
 * Ao digitar **texto** o par de asteriscos desaparece e o texto fica em negrito.
 * O valor armazenado em `value` mantém a marcação **texto** (markdown simples).
 */

import { useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

// Converte markdown bold para HTML preservando quebras de linha
function toDisplayHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

// Extrai texto plano de um nó do DOM, convertendo <br> em \n e <strong> em **texto**
function domToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") return "\n";
    const inner = Array.from(el.childNodes).map(domToMarkdown).join("");
    if (tag === "strong" || tag === "b") return `**${inner}**`;
    if (tag === "div" || tag === "p") return inner + "\n";
    return inner;
  }
  return "";
}

// Salva e restaura a posição do cursor em um contenteditable
function saveCaret(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function restoreCaret(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node: Text | null = null;
  while ((node = walker.nextNode() as Text | null)) {
    const len = (node.textContent ?? "").length;
    if (remaining <= len) break;
    remaining -= len;
  }
  if (!node) return;
  try {
    const range = document.createRange();
    range.setStart(node, Math.min(remaining, (node.textContent ?? "").length));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // ignora erros de posicionamento
  }
}

export default function AtaEditor({
  value,
  onChange,
  placeholder = "Descreva o que ocorreu... Use **negrito** para destacar.",
  className = "",
  minHeight = 120,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // flag para evitar loop onChange → useEffect → DOM update → onChange
  const isComposing = useRef(false);
  const lastMarkdown = useRef(value);

  // Sincroniza valor externo → DOM (ex: ao carregar ocorrência salva)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (lastMarkdown.current === value) return; // sem mudança, não reescrewe o DOM
    lastMarkdown.current = value;
    const caretPos = document.activeElement === el ? saveCaret(el) : -1;
    el.innerHTML = toDisplayHtml(value);
    if (caretPos >= 0) restoreCaret(el, caretPos);
  }, [value]);

  // Inicializa o DOM na montagem
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = toDisplayHtml(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = ref.current;
    if (!el) return;
    const caretPos = saveCaret(el);
    const markdown = domToMarkdown(el).replace(/\n$/, ""); // remove trailing newline
    lastMarkdown.current = markdown;
    // Re-renderiza HTML com bold aplicado
    el.innerHTML = toDisplayHtml(markdown);
    restoreCaret(el, caretPos);
    onChange(markdown);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter insere \n via execCommand para manter o DOM consistente
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  }, []);

  return (
    <div className="relative">
      {/* placeholder */}
      {!value && (
        <span
          className="absolute top-3 left-4 text-sm text-slate-400 pointer-events-none select-none"
          aria-hidden="true"
        >
          {placeholder}
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Relato do ocorrido"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed whitespace-pre-wrap break-words ${className}`}
        style={{ minHeight }}
      />
    </div>
  );
}

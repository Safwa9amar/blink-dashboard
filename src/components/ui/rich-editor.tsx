"use client";

// Headless rich-text editor (Tiptap) styled to the dashboard tokens via the
// `.blink-prose` class in globals.css. Reusable across features — value/onChange
// carry HTML. Image upload reads the file client-side into a data URL; a real
// backend would upload to Supabase Storage / Vercel Blob and insert the URL.
import { useEffect, useRef, type ReactNode } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { DashIcon } from "./icons";

type Dir = "ltr" | "rtl";

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-8 min-w-8 px-1.5 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-primary text-white" : "text-subtext hover:bg-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="w-px h-5 bg-border mx-1 shrink-0" />;

export function RichEditor({
  value,
  onChange,
  dir = "ltr",
  placeholder,
  onUploadImage,
  maxImages,
  maxLength,
}: {
  value: string;
  onChange: (html: string) => void;
  dir?: Dir;
  placeholder?: string;
  // When provided, inserted images are uploaded (e.g. to Supabase Storage) and
  // the returned URL is used; otherwise the image is inlined as a data-URL.
  onUploadImage?: (file: File) => Promise<string>;
  // Editorial caps (from Settings → News): block inserting beyond `maxImages`
  // images, and show a character counter against `maxLength`.
  maxImages?: number;
  maxLength?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const lastHtml = useRef(value);

  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR — avoids hydration mismatch
    shouldRerenderOnTransaction: false, // toolbar reactivity comes from useEditorState below
    extensions: [
      StarterKit,
      Image.configure({ inline: false, HTMLAttributes: { class: "blink-prose-img" } }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    editorProps: { attributes: { class: "blink-prose" } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtml.current = html;
      onChange(html);
    },
  });

  // Sync external value changes (e.g. switching the active language) without
  // clobbering the cursor while the author is typing.
  useEffect(() => {
    if (editor && value !== lastHtml.current) {
      lastHtml.current = value;
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      underline: e?.isActive("underline") ?? false,
      strike: e?.isActive("strike") ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      quote: e?.isActive("blockquote") ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
      chars: e?.getText().length ?? 0,
      images: e ? (e.getHTML().match(/<img/gi) ?? []).length : 0,
    }),
  });

  const atImageLimit = maxImages != null && (s?.images ?? 0) >= maxImages;
  const overLength = maxLength != null && (s?.chars ?? 0) > maxLength;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    if (atImageLimit) return; // editorial cap reached

    if (onUploadImage) {
      try {
        const src = await onUploadImage(file);
        editor.chain().focus().setImage({ src }).run();
      } catch (err) {
        console.error("image upload failed:", err);
      }
      return;
    }

    // Fallback: inline as a data-URL (no uploader wired).
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }

  if (!editor || !s) {
    // Skeleton sized to the mounted control (≈45px toolbar + 236px body) to avoid
    // a layout shift when the SSR-deferred editor hydrates in.
    return (
      <div className="rounded-[10px] border border-border bg-background overflow-hidden" aria-busy>
        <div className="h-[45px] border-b border-border" />
        <div className="h-[236px]" />
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-border bg-background overflow-hidden focus-within:border-primary">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border">
        <ToolBtn title="Bold" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <DashIcon name="bold" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Italic" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <DashIcon name="italic" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Underline" active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <DashIcon name="underline" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <DashIcon name="strikethrough" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Heading 2" active={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolBtn>
        <ToolBtn title="Heading 3" active={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolBtn>
        <Sep />
        <ToolBtn title="Bullet list" active={s.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <DashIcon name="list-bullet" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={s.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <DashIcon name="list-numbered" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Quote" active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <DashIcon name="quote" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <Sep />
        <ToolBtn
          title={atImageLimit ? `Image limit reached (${maxImages})` : "Insert image"}
          disabled={atImageLimit}
          onClick={() => fileRef.current?.click()}
        >
          <DashIcon name="image" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Undo" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <DashIcon name="undo" className="w-[15px] h-[15px]" />
        </ToolBtn>
        <ToolBtn title="Redo" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <DashIcon name="redo" className="w-[15px] h-[15px]" />
        </ToolBtn>
      </div>
      <div dir={dir}>
        <EditorContent editor={editor} />
      </div>
      {(maxLength != null || maxImages != null) && (
        <div className="flex items-center justify-end gap-3 px-2.5 py-1.5 border-t border-border text-[11px] text-subtext">
          {maxImages != null && (
            <span className={atImageLimit ? "text-warning font-semibold" : ""}>
              {s.images}/{maxImages} images
            </span>
          )}
          {maxLength != null && (
            <span className={overLength ? "text-danger font-semibold" : ""}>
              {s.chars}/{maxLength}
            </span>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon } from "lucide-react";

export const MAIL_EDITOR_DEFAULT_HTML =
  "<p>Merhaba,</p><p>Mesajınızı buraya yazabilirsiniz.</p>";

type Props = {
  initialHtml: string;
  onChange: (html: string) => void;
};

export function MailRichEditor({ initialHtml, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Mesajınızı yazın…",
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[220px] px-3 py-2 text-base leading-relaxed [&_p]:my-2 [&_p:first-child]:mt-0",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[260px] rounded-md border border-input bg-muted/20 shadow-sm animate-pulse" />
    );
  }

  return (
    <div className="rounded-md border border-input bg-transparent shadow-sm overflow-hidden min-w-0">
      <div
        className="flex flex-wrap gap-0.5 border-b border-input bg-muted/30 p-1.5"
        role="toolbar"
        aria-label="Metin biçimlendirme"
      >
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          title="Kalın"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
          <span className="sr-only">Kalın</span>
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          title="İtalik"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
          <span className="sr-only">İtalik</span>
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          title="Altı çizili"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
          <span className="sr-only">Altı çizili</span>
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          title="Üstü çizili"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
          <span className="sr-only">Üstü çizili</span>
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

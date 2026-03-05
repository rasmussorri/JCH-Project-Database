import { useEffect } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '../ui/utils';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const toolbarBtnClass =
  'p-2 rounded text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors';

export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'min-h-[var(--min-height)] px-4 py-2 text-slate-100 outline-none max-w-none [&_p]:my-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_li]:list-item',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    // Only sync when the caller has a real value that differs from what's in the editor.
    // Skipping the '' → '<p></p>' case prevents Tiptap from leaving stale stored marks.
    if (!value) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isUnderline: ctx.editor?.isActive('underline') ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isOrderedList: ctx.editor?.isActive('orderedList') ?? false,
    }),
  });

  if (!editor) return null;

  return (
    <div
      className={cn('rounded-lg border border-slate-700 bg-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50', className)}
      style={{ ['--min-height' as string]: minHeight }}
    >
      <div className="flex gap-1 border-b border-slate-700 p-1">
        <button
          type="button"
          tabIndex={-1}
          title="Bold (Cmd+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(toolbarBtnClass, editorState?.isBold && 'bg-slate-600 text-white font-bold')}
        >
          B
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Italic (Cmd+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(toolbarBtnClass, editorState?.isItalic && 'bg-slate-600 text-white italic')}
        >
          I
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Underline (Cmd+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(toolbarBtnClass, editorState?.isUnderline && 'bg-slate-600 text-white underline')}
        >
          U
        </button>
        <span className="w-px bg-slate-600 self-stretch my-1" aria-hidden />
        <button
          type="button"
          tabIndex={-1}
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(toolbarBtnClass, editorState?.isBulletList && 'bg-slate-600 text-white')}
        >
          • List
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(toolbarBtnClass, editorState?.isOrderedList && 'bg-slate-600 text-white')}
        >
          1. List
        </button>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgb(100 116 139);
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror li {
          display: list-item;
        }
      `}</style>
    </div>
  );
}

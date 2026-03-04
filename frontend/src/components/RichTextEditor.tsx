import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
    content: value || '',
    editorProps: {
      attributes: {
        class: 'min-h-[var(--min-height)] px-4 py-2 text-slate-100 outline-none prose prose-invert prose-p:my-1 max-w-none',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: true,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '<p></p>';
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

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
          className={cn(toolbarBtnClass, editor.isActive('bold') && 'bg-slate-600 text-white font-bold')}
        >
          B
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Italic (Cmd+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(toolbarBtnClass, editor.isActive('italic') && 'bg-slate-600 text-white italic')}
        >
          I
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Underline (Cmd+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(toolbarBtnClass, editor.isActive('underline') && 'bg-slate-600 text-white underline')}
        >
          U
        </button>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgb(100 116 139);
        }
      `}</style>
    </div>
  );
}

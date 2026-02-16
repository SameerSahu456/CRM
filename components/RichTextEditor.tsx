import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isDark: boolean;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  isDark,
  minHeight = '60px',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. when loading data for edit)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== (editor.getHTML() === '<p></p>' ? '' : editor.getHTML())) {
      editor.commands.setContent(value || '');
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1 rounded transition-colors ${
      active
        ? isDark
          ? 'bg-zinc-600 text-white'
          : 'bg-slate-300 text-slate-900'
        : isDark
          ? 'text-zinc-400 hover:text-white hover:bg-zinc-700'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
    }`;

  return (
    <div
      className={`rounded-lg border text-xs transition-all ${
        isDark
          ? 'bg-dark-100 border-zinc-700 focus-within:border-brand-500'
          : 'bg-white border-slate-200 focus-within:border-brand-500'
      } focus-within:ring-1 focus-within:ring-brand-500`}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center gap-0.5 px-1.5 py-1 border-b ${
          isDark ? 'border-zinc-700' : 'border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Ordered List"
        >
          <ListOrdered className="w-3 h-3" />
        </button>
      </div>

      {/* Editor content */}
      <style>{`
        .rte-content .ProseMirror {
          min-height: ${minHeight};
          padding: 6px 8px;
          outline: none;
          font-size: 12px;
          line-height: 1.5;
          color: ${isDark ? '#e4e4e7' : '#1e293b'};
        }
        .rte-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${isDark ? '#52525b' : '#94a3b8'};
          pointer-events: none;
          height: 0;
        }
        .rte-content .ProseMirror strong { font-weight: 600; }
        .rte-content .ProseMirror em { font-style: italic; }
        .rte-content .ProseMirror ul { list-style: disc; padding-left: 16px; }
        .rte-content .ProseMirror ol { list-style: decimal; padding-left: 16px; }
        .rte-content .ProseMirror li { margin-bottom: 2px; }
        .rte-content .ProseMirror p { margin-bottom: 4px; }
      `}</style>
      <div className="rte-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

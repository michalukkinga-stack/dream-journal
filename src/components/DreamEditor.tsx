import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'

interface DreamEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
}

export function DreamEditor({ value, onChange, className }: DreamEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: 'Co zapamiętałeś?\nKto pojawił się w tym śnie?\nW jakim miejscu toczyła się akcja?',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[180px] outline-none p-4 text-sm leading-relaxed',
      },
    },
  })

  return (
    <div
      className={cn(
        'dream-editor rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm',
        'focus-within:ring-1 focus-within:ring-[#94d5c9]/40 transition-shadow',
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

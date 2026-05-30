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
        'dream-editor rounded-xl backdrop-blur-sm transition-shadow',
        '[background:rgba(255,255,255,0.07)] [border:1px_solid_rgba(255,255,255,0.12)] [box-shadow:0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]',
        'focus-within:[border-color:rgba(255,255,255,0.25)] focus-within:[box-shadow:0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]',
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

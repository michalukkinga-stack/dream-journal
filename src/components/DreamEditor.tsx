import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface DreamEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
}

export function DreamEditor({ value, onChange, className }: DreamEditorProps) {
  const { isSupported, isListening, start, stop } = useSpeechRecognition()
  const interimLengthRef = useRef(0)

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
        placeholder: 'Co zapamiętałeś?\nKto pojawił się w tym śnie?\nW jakim miejscu toczyła się akcja?\nJakie emocje wzbudził ten sen?',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'outline-none text-sm leading-relaxed dream-editor-content',
      },
    },
  })

  function toggleMic() {
    if (isListening) {
      stop()
      if (editor && interimLengthRef.current > 0) {
        const pos = editor.state.selection.from
        editor.commands.deleteRange({ from: pos - interimLengthRef.current, to: pos })
        interimLengthRef.current = 0
      }
    } else {
      start(
        (text) => {
          if (editor) {
            if (interimLengthRef.current > 0) {
              const pos = editor.state.selection.from
              editor.commands.deleteRange({ from: pos - interimLengthRef.current, to: pos })
              interimLengthRef.current = 0
            }
            editor.commands.insertContent(text + ' ')
          }
        },
        (interimText: string) => {
          if (editor) {
            if (interimLengthRef.current > 0) {
              const pos = editor.state.selection.from
              editor.commands.deleteRange({ from: pos - interimLengthRef.current, to: pos })
            }
            editor.commands.insertContent(interimText)
            interimLengthRef.current = interimText.length
          }
        }
      )
    }
  }

  return (
    <div className={cn('flex gap-3 items-center', className)}>
      <div className="dream-editor flex-1">
        <EditorContent editor={editor} />
      </div>

      {isSupported && (
        <button
          type="button"
          onClick={toggleMic}
          className={cn(
            'shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95',
            isListening
              ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.35)] animate-pulse'
              : 'text-white/30 hover:text-white/60 hover:bg-white/10'
          )}
        >
          <Mic size={20} />
        </button>
      )}
    </div>
  )
}

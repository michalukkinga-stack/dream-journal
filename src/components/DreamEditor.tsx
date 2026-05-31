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
        placeholder: 'Co zapamiętałeś?\nKto pojawił się w tym śnie?\nW jakim miejscu toczyła się akcja?',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[180px] outline-none p-4 text-sm leading-relaxed dream-editor-content',
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
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'dream-editor rounded-xl backdrop-blur-sm transition-shadow',
          '[background:rgba(255,255,255,0.07)] [border:1px_solid_rgba(255,255,255,0.12)] [box-shadow:0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]',
          'focus-within:[border-color:rgba(255,255,255,0.25)] focus-within:[box-shadow:0_4px_20px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]',
          isSupported && 'pb-8',
        )}
      >
        <EditorContent editor={editor} />
      </div>

      {isSupported && (
        <button
          type="button"
          onClick={toggleMic}
          className={cn(
            'absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95',
            isListening
              ? 'bg-green-500/20 text-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.35)] animate-pulse'
              : 'text-white/40 hover:text-white/70 hover:bg-white/10'
          )}
        >
          <Mic size={14} />
        </button>
      )}
    </div>
  )
}

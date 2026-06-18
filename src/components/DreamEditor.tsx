import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface DreamEditorProps {
  value: string
  onChange: (html: string) => void
  onListeningChange?: (isListening: boolean) => void
  className?: string
}

export interface DreamEditorHandle {
  toggleMic: () => void
  isListening: boolean
  isSupported: boolean
}

export const DreamEditor = forwardRef<DreamEditorHandle, DreamEditorProps>(
  ({ value, onChange, onListeningChange, className }, ref) => {
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
          class: 'outline-none text-sm md:text-base leading-relaxed dream-editor-content',
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

    useEffect(() => { onListeningChange?.(isListening) }, [isListening, onListeningChange])

    useImperativeHandle(ref, () => ({ toggleMic, isListening, isSupported }))

    return (
      <div className={cn('dream-editor', className)}>
        <EditorContent editor={editor} />
      </div>
    )
  }
)

DreamEditor.displayName = 'DreamEditor'

import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Toggle } from '@/components/ui/toggle';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CornerDownLeft,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  // Strikethrough,
  Undo2,
  // Youtube,
} from "lucide-react";


function DefaultToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-b-0 rounded-sm p-1 mb-1 space-x-1 z-50 ">
      {children}
    </div>
  );
}

// function FloatingToolbar({ children }) {
//   return (
//     <Toolbar variant='floating'>
//       {children}
//     </Toolbar>
//   );
// }

function MenuBar({ editor, /* floating = false */ }: { editor: Editor, floating?: boolean }) {
  if (!editor) {
    return null;
  }

  // const [height, setHeight] = React.useState(480)
  // const [width, setWidth] = React.useState(640)

  // const addYoutubeVideo = () => {
  //   const url = prompt('Enter YouTube URL')

  //   if (url) {
  //     editor.commands.setYoutubeVideo({
  //       src: url,
  //       width: Math.max(320, parseInt(width, 10)) || 640,
  //       height: Math.max(180, parseInt(height, 10)) || 480,
  //     })
  //   }
  // }

  const editorState = useEditorState({
    editor,
    selector: ctx => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isLeftAlign: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
        isCenterAlign: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
        isRightAlign: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
        isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
        isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        isHighlight: ctx.editor.isActive('highlight') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      }
    },
  })

  const Options = [
    {
      icon: <Heading1 className="size-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      pressed: editorState.isHeading1,
      enabled: true,
    },
    {
      icon: <Heading2 className="size-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      pressed: editorState.isHeading2,
      enabled: true,
    },
    {
      icon: <Heading3 className="size-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      pressed: editorState.isHeading3,
      enabled: true,
    },
    {
      icon: <Bold className="size-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      pressed: editorState.isBold,
      enabled: true,
    },
    {
      icon: <Italic className="size-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      pressed: editorState.isItalic,
      enabled: true,
    },
    // {
    //   icon: <Strikethrough className="size-4" />,
    //   onClick: () => editor.chain().focus().toggleStrike().run(),
    //   pressed: editorState.isStrike,
    //   enabled: true,
    // },
    {
      icon: <AlignLeft className="size-4" />,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      pressed: editorState.isLeftAlign,
      enabled: true,
    },
    {
      icon: <AlignCenter className="size-4" />,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      pressed: editorState.isCenterAlign,
      enabled: true,
    },
    {
      icon: <AlignRight className="size-4" />,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      pressed: editorState.isRightAlign,
      enabled: true,
    },
    {
      icon: <List className="size-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      pressed: editorState.isBulletList,
      enabled: true,
    },
    {
      icon: <ListOrdered className="size-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      pressed: editorState.isOrderedList,
      enabled: true,
    },
    {
      icon: <Highlighter className="size-4" />,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      pressed: editorState.isHighlight,
      enabled: true,
    },
    {
      icon: <CornerDownLeft className="size-4" />,
      onClick: () => editor.chain().focus().setHardBreak().run(),
      enabled: true,
      shortcut: "Shift+Enter"
    },
    // {
    //   icon: <Youtube className="size-4" />,
    //   onClick: () => addYoutubeVideo(),
    //   enabled: true,
    //   // shortcut: "Shift+Enter"
    // },
    {
      icon: <Undo2 className="size-4" />,
      onClick: () => editor.chain().focus().undo().run(),
      enabled: editorState.canUndo,
      shortcut: "Ctrl+Z"
    },
    {
      icon: <Redo2 className="size-4" />,
      onClick: () => editor.chain().focus().redo().run(),
      enabled: editorState.canRedo,
      shortcut: "Ctrl+Shift+Z or Ctrl+Y"
    },
  ];


  const toolbarContent = Options.map((option, index) => (
    <Toggle
      key={index}
      pressed={option.pressed ?? false}
      onPressedChange={option.onClick}
      disabled={!option.enabled}
      title={option.shortcut ? `Shortcut: ${option.shortcut}` : undefined}
    >
      {option.icon}
    </Toggle>
  ));

  return (
    // floating ? (
    //   <FloatingToolbar >{toolbarContent}</FloatingToolbar>
    // ) : (
    <DefaultToolbar>{toolbarContent}</DefaultToolbar>
    // )
  );

}

export default MenuBar
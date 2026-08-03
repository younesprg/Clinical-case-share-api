"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Bold, Italic, Strikethrough, List, ListOrdered, Image as ImageIcon, Link, FileText, FlaskConical, Stethoscope } from 'lucide-react';

const RichTextEditor = ({ content, onChange }: { content: string, onChange: (content: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Klinik vakanızı detaylandırmaya başlayın...',
                emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-slate-400 before:pointer-events-none'
            }),
            CharacterCount.configure({
                limit: 10000,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-base mx-auto focus:outline-none min-h-[300px] p-6 text-slate-800 bg-white',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-blue-200/60 rounded-2xl shadow-sm bg-white overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-400/40 focus-within:border-blue-400">
            {/* Toolbar */}
            <div className="bg-slate-50/80 border-b border-blue-100/60 px-4 py-3 flex flex-wrap items-center gap-2">
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
                    className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
                    className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    <Italic size={18} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
                    className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    <Strikethrough size={18} />
                </button>
                
                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
                    className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    <List size={18} />
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
                    className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    <ListOrdered size={18} />
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1"></div>

                <button
                    onClick={(e) => { e.preventDefault(); alert("Laboratuvar sonucu ekleme modülü yakında"); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    title="Tahlil/Laboratuvar Ekle"
                >
                    <FlaskConical size={16} /> <span className="hidden sm:inline">Lab</span>
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); alert("Görüntü/Röntgen ekleme modülü yakında"); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    title="Röntgen/MR Görüntüsü Ekle"
                >
                    <ImageIcon size={16} /> <span className="hidden sm:inline">Görüntü</span>
                </button>
                <button
                    onClick={(e) => { e.preventDefault(); alert("Fizik Muayene şablonu eklenecek"); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                    title="Fizik Muayene Ekle"
                >
                    <Stethoscope size={16} /> <span className="hidden sm:inline">Muayene</span>
                </button>
            </div>

            {/* Editor Area */}
            <div className="relative">
                <EditorContent editor={editor} className="bg-white min-h-[300px]" />
            </div>

            {/* Footer / Character Count */}
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs text-slate-400 font-semibold tracking-wide">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{editor.storage.characterCount.words()} kelime</span>
                </div>
                <div>
                    {editor.storage.characterCount.characters()} / 10,000 karakter
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;

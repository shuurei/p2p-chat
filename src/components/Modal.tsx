interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg">{title}</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
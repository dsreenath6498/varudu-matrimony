import React, { useState } from 'react';

// Define the shape of our messages
interface Message {
    text: string;
    sender: 'user' | 'bot';
    profiles?: any[]; // <-- New field to hold the rich data!
}

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: 'Namaskaram! How can I help you find your perfect match today? (You can type in English or Telugu)', sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (isOpen) setIsExpanded(false); // Reset expand state when closing
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const sendMessage = async () => {
        if (!input.trim()) return;

        // Add user message to UI immediately
        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setInput('');
        setIsLoading(true);

        try {
            // Send message to our new backend route
            const response = await fetch('http://localhost:3000/api/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: messages })
            });

            const data = await response.json();

            // Add bot's reply to UI, including the profiles array!
            setMessages(prev => [...prev, { text: data.reply, sender: 'bot', profiles: data.profiles }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting.', sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`z-[100] flex flex-col items-end ${isExpanded ? 'fixed inset-4' : 'fixed bottom-6 right-6'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className={`${isExpanded ? 'w-full h-full rounded-2xl' : 'mb-4 w-80 h-96 rounded-2xl'} bg-[var(--bg-base)] border border-[var(--primary)] shadow-2xl flex flex-col overflow-hidden backdrop-blur-md bg-opacity-95 transition-all duration-300`}>
                    {/* Header */}
                    <div className="bg-[var(--primary)] text-white p-3 font-semibold flex justify-between items-center shadow-md">
                        <span>✨ AI Matchmaker</span>
                        <div className="flex gap-4 items-center">
                            <button onClick={toggleExpand} className="text-white hover:text-gray-300 transition" title={isExpanded ? "Minimize" : "Expand"}>
                                {isExpanded ? '🗗' : '🗖'}
                            </button>
                            <button onClick={toggleChat} className="text-white hover:text-gray-300 transition text-lg leading-none" title="Close">
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-black/5">
                        {messages.map((msg, index) => (
                            <div key={index} className="flex flex-col w-full">
                                <div
                                    className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${msg.sender === 'user'
                                            ? 'bg-[var(--primary)] text-white self-end rounded-br-sm'
                                            : 'bg-white/10 text-[var(--text-primary)] border border-[var(--primary)] border-opacity-30 self-start rounded-bl-sm backdrop-blur-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {/* 💎 THE MAGIC PROFILE CARDS 💎 */}
                                {msg.profiles && msg.profiles.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto py-3 w-full snap-x pb-2 scrollbar-thin scrollbar-thumb-[var(--primary)] scrollbar-track-transparent">
                                        {msg.profiles.map((p: any, i: number) => (
                                            <div key={i} className="min-w-[140px] bg-white text-black p-3 rounded-xl shadow-lg border border-gray-200 snap-center flex flex-col items-center shrink-0">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full mb-2 overflow-hidden border-2 border-[var(--primary)]">
                                                    {p.photos && p.photos !== '[]' && p.photos !== null ? (
                                                        <img src={JSON.parse(p.photos)[0]} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                                    )}
                                                </div>
                                                <div className="font-bold text-sm truncate w-full text-center">{p.name || 'Anonymous'}</div>
                                                <div className="text-xs text-gray-600 font-medium">{p.age ? `${p.age} yrs` : 'Age N/A'}</div>
                                                <div className="text-xs text-[var(--primary)] font-semibold truncate w-full text-center mt-1 bg-[var(--primary)]/10 px-2 py-0.5 rounded-full">{p.place || 'Unknown'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && <div className="text-sm text-[var(--primary)] self-start animate-pulse">Typing...</div>}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/10 flex gap-2 items-center bg-black/10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask anything..."
                            /* Changed to bg-white and text-black so what you type is always perfectly visible */
                            className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)] text-black shadow-inner"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-[var(--primary)] text-white rounded-full w-10 h-10 flex justify-center items-center hover:scale-105 transition transform shadow-md"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button (Hidden when expanded) */}
            {!isExpanded && (
                <button
                    onClick={toggleChat}
                    className="w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 hover:-translate-y-1 transition transform duration-300 ease-out mt-auto"
                >
                    {isOpen ? '✕' : '💬'}
                </button>
            )}
        </div>
    );
};

export default ChatbotWidget;

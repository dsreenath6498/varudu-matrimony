import React, { useState } from 'react';
import api from '../api';

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
            // Send message to our new backend route using central API client
            const response = await api.post('/chatbot/message', { 
                message: userMsg, 
                history: messages 
            });

            const data = response.data;

            // Add bot's reply to UI, including the profiles array!
            if (data.reply) {
                setMessages(prev => [...prev, { text: data.reply, sender: 'bot', profiles: data.profiles }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { text: 'I encountered an error: ' + data.error, sender: 'bot' }]);
            }
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
                <div 
                    className={`${isExpanded ? 'w-full h-full rounded-2xl' : 'mb-4 w-[360px] h-[500px] rounded-3xl'} flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]`}
                    style={{
                        background: 'linear-gradient(145deg, #FFFDF9, #FFF8E7)',
                        border: '1px solid rgba(212,175,55,0.4)',
                        boxShadow: '0 20px 40px -10px rgba(74,46,27,0.15), 0 0 20px rgba(212,175,55,0.1)'
                    }}
                >
                    {/* Premium Header */}
                    <div 
                        className="p-4 flex justify-between items-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37, #C5A059, #A88655)',
                            borderBottom: '1px solid rgba(74,46,27,0.1)'
                        }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                                <span className="text-xl">✨</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-[#2d1b0f] text-lg leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Varudu AI</h3>
                                <p className="text-[10px] text-[#4a2e1b] uppercase tracking-widest font-semibold">Premium Matchmaker</p>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center relative z-10">
                            <button onClick={toggleExpand} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#2d1b0f] transition-colors" title={isExpanded ? "Minimize" : "Expand"}>
                                {isExpanded ? '🗗' : '🗖'}
                            </button>
                            <button onClick={toggleChat} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#2d1b0f] transition-colors" title="Close">
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 relative">
                        {/* Decorative background logo/watermark could go here */}
                        
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex flex-col w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[85%] p-3.5 text-sm shadow-md font-medium leading-relaxed relative ${msg.sender === 'user'
                                            ? 'bg-gradient-to-br from-[#D4AF37] to-[#C5A059] text-[#2d1b0f] rounded-2xl rounded-tr-sm border border-[#D4AF37]/50'
                                            : 'bg-white text-[#4a2e1b] rounded-2xl rounded-tl-sm border border-[#D4AF37]/20'
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {/* 💎 THE MAGIC PROFILE CARDS 💎 */}
                                {msg.profiles && msg.profiles.length > 0 && (
                                    <div className="flex gap-4 overflow-x-auto py-4 w-[110%] -ml-[5%] px-[5%] snap-x scrollbar-none">
                                        {msg.profiles.map((p: any, i: number) => (
                                            <div key={i} className="min-w-[160px] bg-white rounded-2xl shadow-[0_8px_20px_rgba(74,46,27,0.08)] border border-[#D4AF37]/20 snap-center flex flex-col overflow-hidden shrink-0 group hover:shadow-[0_8px_25px_rgba(212,175,55,0.2)] transition-all">
                                                <div className="h-24 w-full bg-gray-100 relative overflow-hidden">
                                                    {p.photos && p.photos !== '[]' && p.photos !== null ? (
                                                        <img src={JSON.parse(p.photos)[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-[#FFF8E7] to-[#F5E6D3]">👤</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                    <div className="absolute bottom-2 left-2 right-2 text-white">
                                                        <div className="font-bold text-sm truncate drop-shadow-md">{p.name || 'Anonymous'}</div>
                                                        <div className="text-[10px] font-medium opacity-90">{p.age ? `${p.age} yrs` : 'Age N/A'}</div>
                                                    </div>
                                                </div>
                                                <div className="p-3 text-center bg-gradient-to-b from-white to-[#FFFDF9]">
                                                    <div className="text-[11px] text-[#4a2e1b] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                                        <span>📍</span> {p.place || 'Unknown Location'}
                                                    </div>
                                                    <button className="mt-2 w-full py-1.5 text-xs font-bold rounded-lg border border-[#D4AF37] text-[#8b5a2b] hover:bg-[#D4AF37] hover:text-white transition-colors">
                                                        View Profile
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start bg-white border border-[#D4AF37]/20 rounded-2xl rounded-tl-sm p-3 shadow-sm flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-[#D4AF37]/20 flex gap-3 items-center shadow-[0_-4px_15px_rgba(74,46,27,0.03)] z-10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type your message..."
                            className="flex-1 bg-[#FFFDF9] border border-[#D4AF37]/40 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#D4AF37]/20 text-[#4a2e1b] shadow-inner font-medium placeholder-[#8b5a2b]/60 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-white rounded-full w-12 h-12 flex justify-center items-center hover:scale-105 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md font-bold"
                        >
                            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button (Hidden when expanded) */}
            {!isExpanded && (
                <button
                    onClick={toggleChat}
                    className="w-16 h-16 rounded-full shadow-[0_8px_25px_rgba(212,175,55,0.4)] flex items-center justify-center text-3xl hover:scale-110 transition-all duration-300 ease-out mt-auto border-2 border-white/20 relative group"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #A88655)' }}
                >
                    {/* Pulsing ring effect */}
                    {!isOpen && <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40" />}
                    
                    <span className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300">
                        {isOpen ? '✕' : '✨'}
                    </span>
                </button>
            )}
        </div>
    );
};

export default ChatbotWidget;

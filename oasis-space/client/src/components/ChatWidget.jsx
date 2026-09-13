import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots, FaBed, FaBath } from 'react-icons/fa';

const cardImage = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/500';
  if (imageUrl.startsWith('data:')) return imageUrl;
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&output=webp&w=600&q=80`;
};

function ListingCard({ listing }) {
  return (
    <Link
      to={listing.url || `/listing/${listing.id}`}
      className="flex gap-3 bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 hover:border-indigo-500 transition-colors mb-1.5"
    >
      <img
        src={cardImage(listing.image)}
        alt={listing.name}
        className="w-16 h-16 rounded-lg object-cover bg-slate-700 border border-slate-600 flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-white truncate">{listing.name}</p>
          <span className="text-xs font-black text-emerald-400 whitespace-nowrap">
            ₹{Number(listing.price).toLocaleString('en-IN')}{listing.type === 'rent' ? '/mo' : ''}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">{listing.address}</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
          <span className="flex items-center gap-1"><FaBed className="text-slate-500" /> {listing.bedrooms} BHK</span>
          <span className="flex items-center gap-1"><FaBath className="text-slate-500" /> {listing.bathrooms} Bath</span>
          {listing.offer && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white">OFFER</span>}
          <span className="ml-auto text-indigo-400 text-[11px] font-semibold">View →</span>
        </div>
      </div>
    </Link>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Jarvis 🤖. How can I help you find your dream home today?', listings: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare plain-text history (last 6 messages) — structured cards are stripped.
      const history = messages.slice(-6).map(msg => ({ role: msg.role, content: msg.content }));

      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, history })
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, listings: data.listings || [] }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the server.", listings: [] }]);
      }
    } catch (error) {
      console.log(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Network error. Please try again.", listings: [] }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 w-[calc(100vw-2rem)] max-w-[380px] h-[520px] max-h-[70vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-fadeIn">

          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-bold">
              <FaRobot className="text-xl" />
              <span>Oasis AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="text-white hover:text-gray-200">
              <FaTimes />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-900 custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-200 rounded-bl-none'
                  } p-3 rounded-lg text-sm leading-relaxed`}>
                  {msg.content}
                  {msg.listings?.length > 0 && (
                    <div className="mt-3">
                      {msg.listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-400 p-3 rounded-lg rounded-bl-none text-xs italic animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder="Ask about property..."
              className="flex-1 bg-slate-700 text-white text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Send message"
              className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat widget" : "Open chat widget"}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <FaTimes className="text-xl" /> : <FaCommentDots className="text-2xl" />}
      </button>

    </div>
  );
}
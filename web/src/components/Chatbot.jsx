import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader } from 'lucide-react'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I am TrustBot, your octopus guardian. How can I help today?', timestamp: new Date() }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  // Knowledge base (normalized text)
  const knowledgeBase = {
    greetings: {
      keywords: ['hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'hey'],
      responses: [
        'Hello! How can I protect you today?',
        'Hi! I am your octopus guardian. What do you need?',
        'I am here to help with any security question.'
      ]
    },
    phishing: {
      keywords: ['phishing', 'fraude', 'estafa', 'robo', 'hackeo', 'seguro'],
      responses: [
        'El phishing intenta robar tu información haciéndose pasar por sitios legítimos. Yo detecto sitios falsos antes de que ingreses tus datos.',
        'Los atacantes imitan bancos o servicios. Con TrustTentacle verifico cada sitio con 8 tentáculos de protección.'
      ]
    },
    howItWorks: {
      keywords: ['como funciona', 'cómo funciona', 'que hace', 'tentaculos', 'funcionalidad'],
      responses: [
        'Trabajo con 8 tentáculos: Blockchain Registry, Reportes comunitarios, Threat Intelligence, IA, Análisis SSL, Verificación de dominios, Similitud y Reputación.'
      ]
    },
    installation: {
      keywords: ['instalar', 'descargar', 'como instalo', 'extensión', 'chrome'],
      responses: [
        'Instalación: descarga el .zip, abre chrome://extensions/, activa “Modo desarrollador” y carga la carpeta descomprimida.'
      ]
    },
    safe: {
      keywords: ['seguro', 'confiable', 'verificado', 'protegido', 'safe'],
      responses: [
        'Un sitio SEGURO: registrado en blockchain, SSL válido, sin reportes y sin patrones sospechosos.'
      ]
    },
    dangerous: {
      keywords: ['peligroso', 'dangerous', 'riesgo', 'amenaza', 'malicioso'],
      responses: [
        'Marco como PELIGROSO si imita marcas, usa TLDs sospechosos, tiene reportes o la IA detecta riesgos. ¡No ingreses datos!'
      ]
    },
    ia: {
      keywords: ['ia', 'inteligencia artificial', 'ai', 'machine learning', 'deteccion', 'detección'],
      responses: [
        'Mi IA analiza patrones en URL, typosquatting, palabras clave y estructura. Detecta incluso sitios recién creados.'
      ]
    },
    blockchain: {
      keywords: ['blockchain', 'cadena de bloques', 'polygon', 'smart contract'],
      responses: [
        'Blockchain mantiene un registro inmutable de dominios verificados: nadie puede alterarlos.'
      ]
    },
    help: {
      keywords: ['ayuda', 'help', 'que puedes hacer', 'comandos', 'opciones'],
      responses: [
        'Puedo ayudarte con: phishing y seguridad, cómo funciono, instalación, IA, blockchain y verificación de sitios.'
      ]
    },
    banks: {
      keywords: ['banco', 'bank', 'bancario', 'cuenta', 'tarjeta'],
      responses: [
        'Protejo bancos y fintech verificados. En sus sitios oficiales verás el indicador de seguro; si es una copia, te alerto.'
      ]
    },
    thanks: {
      keywords: ['gracias', 'thank', 'excelente', 'genial', 'perfecto'],
      responses: [
        '¡De nada! Estoy aquí para protegerte siempre.',
        '¡Un placer ayudarte! Si tienes más dudas, aquí estaré.',
        'Para eso estoy: tu seguridad es mi misión.'
      ]
    }
  }

  const getResponse = (userMessage) => {
    const messageLower = userMessage.toLowerCase()
    for (const [, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => messageLower.includes(keyword))) {
        const responses = data.responses
        return responses[Math.floor(Math.random() * responses.length)]
      }
    }
    return 'Puedo ayudarte con phishing, cómo funciono, instalación, IA y blockchain. ¿Sobre qué te gustaría saber?'
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    const userMsg = { type: 'user', text: inputMessage, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    const botMsg = { type: 'bot', text: getResponse(userMsg.text), timestamp: new Date() }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = ['What is phishing?', 'How do you protect me?', 'How do I install?', 'What is AI?']

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-tentacle hover:bg-tentacle/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50 animate-pulse"
          aria-label="Abrir chat"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">TT</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-ocean-800 rounded-lg shadow-2xl flex flex-col z-50 border border-tentacle/30">
          <div className="bg-gradient-to-r from-tentacle to-ocean-600 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-float">🐙</div>
              <div>
                <h3 className="font-bold text-white">TrustBot</h3>
                <p className="text-xs text-gray-200">Your octopus guardian</p>
              </div>
            </div>
            <button aria-label="Cerrar" onClick={() => setIsOpen(false)} className="text-white/90 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.type === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.type === 'bot' ? 'bg-white/10' : 'bg-tentacle text-white'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader size={14} className="animate-spin" /> Typing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/10 text-white text-sm rounded-md px-3 py-2 outline-none border border-white/10 focus:border-tentacle"
                placeholder="Type your message…"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button onClick={handleSendMessage} className="bg-tentacle text-white px-3 py-2 rounded-md flex items-center gap-1">
                <Send size={16} /> Send
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button key={idx} onClick={() => setInputMessage(q)} className="text-xs bg-white/10 hover:bg-white/15 text-white px-2 py-1 rounded">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

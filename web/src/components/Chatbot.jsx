import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '¡Hola! 🐙 Soy TrustBot, tu pulpo guardián. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Knowledge base - Respuestas del chatbot
  const knowledgeBase = {
    greetings: {
      keywords: ['hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'hey'],
      responses: [
        '¡Hola! 🐙 ¿Cómo puedo protegerte hoy?',
        '¡Saludos! Soy tu pulpo guardián. ¿Qué necesitas saber?',
        '¡Hola amigo! 🐙 Estoy aquí para ayudarte con cualquier duda sobre seguridad digital.'
      ]
    },
    phishing: {
      keywords: ['phishing', 'fraude', 'estafa', 'robo', 'hackeo', 'seguro'],
      responses: [
        '🎣 El phishing es un intento de robar tu información haciéndose pasar por sitios legítimos. Yo te protejo detectando estos sitios falsos antes de que ingreses tus datos. ¿Quieres saber cómo lo hago?',
        '🎣 ¡Gran pregunta! El phishing es cuando los atacantes crean sitios web falsos que imitan a bancos o servicios conocidos. Con TrustTentacle, verifico cada sitio usando 8 tentáculos de protección. ¿Te gustaría conocer más sobre mis tentáculos?'
      ]
    },
    howItWorks: {
      keywords: ['como funciona', 'como trabaja', 'que hace', 'tentaculos', 'funcionalidad'],
      responses: [
        '🐙 Trabajo con 8 tentáculos de protección:\n\n1. ⛓️ Blockchain Registry - Verifica dominios oficiales\n2. 👥 Reportes Comunitarios\n3. 🛡️ Threat Intelligence\n4. 🧠 IA de Detección\n5. 🔒 Análisis SSL\n6. 🌐 Verificación de Dominios\n7. 🔍 Análisis de Similitud\n8. ⭐ Sistema de Reputación\n\nCada uno analiza diferentes aspectos del sitio. ¿Quieres saber más sobre alguno?'
      ]
    },
    installation: {
      keywords: ['instalar', 'descargar', 'como instalo', 'extension', 'chrome'],
      responses: [
        '📥 ¡Es muy fácil! Sigue estos pasos:\n\n1. Ve a la sección "Descargar"\n2. Descarga el archivo .zip\n3. Abre chrome://extensions/\n4. Activa "Modo desarrollador"\n5. Carga la carpeta descomprimida\n\n¡Listo! Estaré protegiéndote mientras navegas. 🐙'
      ]
    },
    safe: {
      keywords: ['seguro', 'confiable', 'verificado', 'protegido', 'safe'],
      responses: [
        '✅ Un sitio es SEGURO cuando:\n- Está registrado en blockchain\n- Tiene certificado SSL válido\n- No hay reportes de phishing\n- La IA no detecta patrones sospechosos\n- Pasa las 8 verificaciones\n\nCuando veas el ✅ verde, ¡puedes navegar tranquilo!',
        '🛡️ Cuando verifico un sitio y todos mis tentáculos dan luz verde, significa que es un sitio oficial y confiable. Te mostraré el sello de SAFE con 100% de confianza.'
      ]
    },
    dangerous: {
      keywords: ['peligroso', 'dangerous', 'riesgo', 'amenaza', 'malicioso'],
      responses: [
        '🚨 Marco un sitio como PELIGROSO cuando:\n- Imita marcas conocidas (ej: paypa1 en vez de paypal)\n- Usa dominios sospechosos (.tk, .ml)\n- Tiene reportes de phishing\n- La IA detecta múltiples señales de alerta\n\n¡NUNCA ingreses tus datos en estos sitios! 🛑'
      ]
    },
    ia: {
      keywords: ['ia', 'inteligencia artificial', 'ai', 'machine learning', 'deteccion'],
      responses: [
        '🧠 Mi IA analiza:\n- Patrones en la URL (números, guiones, símbolos)\n- Imitación de marcas (typosquatting)\n- Palabras clave sospechosas\n- Estructura del sitio\n\n¡Puedo detectar phishing incluso en sitios que acaban de crearse!',
        '🧠 Uso inteligencia artificial para detectar patrones de phishing en tiempo real. Aprendo de miles de casos y puedo identificar amenazas nuevas sin necesidad de que estén en una lista. ¡Es como tener un cerebro de pulpo muy inteligente!'
      ]
    },
    blockchain: {
      keywords: ['blockchain', 'cadena de bloques', 'polygon', 'smart contract'],
      responses: [
        '⛓️ Uso blockchain para mantener un registro inmutable de dominios verificados. Cuando un banco o empresa registra su dominio oficial en la blockchain, nadie puede alterarlo. ¡Es como una lista de confianza que no puede ser hackeada!'
      ]
    },
    help: {
      keywords: ['ayuda', 'help', 'que puedes hacer', 'comandos', 'opciones'],
      responses: [
        '🐙 Puedo ayudarte con:\n\n💡 Explicarte qué es el phishing\n🛡️ Contarte cómo te protejo\n📥 Guiarte en la instalación\n🧠 Explicarte mi IA\n⛓️ Hablarte sobre blockchain\n✅ Decirte qué sitios son seguros\n\n¿Sobre qué quieres saber más?'
      ]
    },
    banks: {
      keywords: ['banco', 'bank', 'bancario', 'cuenta', 'tarjeta'],
      responses: [
        '🏦 ¡Excelente pregunta! Protejo especialmente a bancos argentinos como:\n- Banco Galicia\n- Banco Nación\n- HSBC\n- Santander\n- Macro\n\nCuando visites sus sitios oficiales, verás el ✅ verde. Si ves una copia falsa, ¡te alertaré al instante! 🚨'
      ]
    },
    octopus: {
      keywords: ['pulpo', 'octopus', 'tentaculo', 'hackathon'],
      responses: [
        '🐙 ¡Sí! Soy un pulpo porque tengo 8 tentáculos de protección, perfecto para el Octopus Hackathon 2025. Cada tentáculo verifica un aspecto diferente de seguridad. ¡Juntos formamos el guardián digital perfecto!',
        '🐙 El concepto del pulpo es genial porque:\n- 8 tentáculos = 8 funcionalidades\n- Inteligente y adaptable\n- Siempre vigilante\n- Protege en múltiples direcciones\n\n¡Soy tu guardián en el océano digital! 🌊'
      ]
    },
    stats: {
      keywords: ['estadisticas', 'stats', 'numeros', 'cuantos', 'datos'],
      responses: [
        '📊 Estadísticas actuales:\n- 10,000+ sitios verificados\n- 2,500+ amenazas bloqueadas\n- 5,000+ usuarios protegidos\n- 40+ dominios en base de datos\n- 100% de detección en tests\n\n¡Y creciendo cada día! 🚀'
      ]
    },
    thanks: {
      keywords: ['gracias', 'thank', 'excelente', 'genial', 'perfecto'],
      responses: [
        '¡De nada! 🐙 Estoy aquí para protegerte siempre.',
        '¡Un placer ayudarte! Si tienes más dudas, aquí estaré. 🐙',
        '¡Para eso estoy! Tu seguridad es mi misión. 🛡️'
      ]
    }
  };

  const getResponse = (userMessage) => {
    const messageLower = userMessage.toLowerCase();
    
    // Buscar en la base de conocimiento
    for (const [category, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => messageLower.includes(keyword))) {
        const responses = data.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Respuesta por defecto
    return '🐙 Mmm, no estoy seguro de entender. Puedo ayudarte con:\n- Phishing y seguridad\n- Cómo funciono\n- Instalación\n- Blockchain e IA\n\n¿Sobre qué te gustaría saber?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Agregar mensaje del usuario
    const userMsg = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simular typing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generar respuesta del bot
    const botResponse = getResponse(inputMessage);
    const botMsg = {
      type: 'bot',
      text: botResponse,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    '¿Qué es el phishing?',
    '¿Cómo me proteges?',
    '¿Cómo te instalo?',
    '¿Qué es la IA?'
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-tentacle hover:bg-tentacle/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50 animate-pulse"
          aria-label="Abrir chat"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            🐙
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-ocean-800 rounded-lg shadow-2xl flex flex-col z-50 border border-tentacle/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-tentacle to-ocean-600 p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl animate-float">🐙</div>
              <div>
                <h3 className="font-bold text-white">TrustBot</h3>
                <p className="text-xs text-gray-200">Tu pulpo guardián</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-tentacle text-white'
                      : 'bg-ocean-700 text-gray-100'
                  }`}
                >
                  {msg.type === 'bot' && <span className="text-xl mr-2">🐙</span>}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-ocean-700 text-gray-100 rounded-lg p-3 flex items-center space-x-2">
                  <span className="text-xl">🐙</span>
                  <Loader className="animate-spin" size={16} />
                  <span>Escribiendo...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-ocean-700">
              <p className="text-xs text-gray-400 mb-2">Preguntas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(question);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="text-xs bg-ocean-700 hover:bg-tentacle/20 text-gray-300 px-3 py-1 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-ocean-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-ocean-700 text-white border border-ocean-600 rounded-lg px-4 py-2 focus:outline-none focus:border-tentacle"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-tentacle hover:bg-tentacle/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

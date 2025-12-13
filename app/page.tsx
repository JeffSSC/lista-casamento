'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';

type Gift = {
  id: number;
  name: string;
  price: number;
  link: string;
  available: boolean;
  category: string;
};

const PRICE_THRESHOLD = 200;

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<'essential' | 'custom'>('essential');

  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCustomGiftModal, setShowCustomGiftModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [customGiftName, setCustomGiftName] = useState('');

  const fetchGifts = async () => {
    const { data, error } = await supabase.from('gifts').select('*').order('price', { ascending: false });

    if (error) {
      console.log("Erro do Supabase:", error.message);
    } else {
      console.log("Dados recebidos:", data);
    }

    if (data) setGifts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGifts();

    const subscription = supabase.channel('gifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, fetchGifts)
      .subscribe();
    return () => { subscription.unsubscribe(); }
  }, []);

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('gifts')
      .update({
        available: false,
        buyer_name: formName,
        buyer_phone: formPhone,
        buyer_message: formMessage
      })
      .eq('id', selectedGift.id);

    if (error) {
      alert('Erro ao confirmar. Tente novamente.');
    } else {
      setSelectedGift(null);
      fetchGifts();
    }
    setIsSubmitting(false);
  };

  const handleCreateCustomGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('gifts')
      .insert([
        {
          name: customGiftName,
          price: 0,
          link: '#', // Sem link para customizados
          available: false, // Já nasce comprado
          category: 'custom', // Categoria fixa para personalizados
          buyer_name: formName,
          buyer_phone: formPhone,
          buyer_message: formMessage
        }
      ]);

    if (error) {
      console.error(error);
      alert('Erro ao adicionar presente. Tente novamente.');
    } else {
      setShowCustomGiftModal(false);
      setCustomGiftName('');
      setFormName('');
      setFormPhone('');
      setFormMessage('');
      fetchGifts();
      alert('Presente adicionado com sucesso! Obrigado!');
    }
    setIsSubmitting(false);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const GiftCard = ({ item }: { item: Gift }) => (
    <div className={`
      relative px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all duration-300 group
      ${!item.available ? 'opacity-60 grayscale-[0.8] bg-gray-100/80' : 'hover:scale-[1.01] border-l-4 border-l-transparent hover:border-l-pink-500'}
    `}>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 overflow-hidden">
          <span className={`font-bold text-sm sm:text-base text-gray-800 truncate ${!item.available ? 'line-through text-gray-400' : 'group-hover:text-pink-600 transition-colors'}`}>
            {item.name}
          </span>
          {item.available ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-bold text-xs sm:text-sm whitespace-nowrap">
                {formatMoney(item.price)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium text-xs sm:text-sm line-through whitespace-nowrap">
                {formatMoney(item.price)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {item.available ? (
          <>
            <label className="flex items-center gap-2 cursor-pointer group/check" title="Marcar para presentear">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer appearance-none w-5 h-5 border-2 border-pink-300 rounded focus:ring-2 focus:ring-pink-500/20 checked:bg-pink-500 checked:border-transparent transition-all"
                  checked={false}
                  onChange={() => {
                    setFormName(''); setFormPhone(''); setFormMessage('');
                    setSelectedGift(item);
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 font-bold text-xs">
                  ✓
                </div>
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover/check:text-pink-600 transition-colors hidden sm:inline">
                Presentear
              </span>
            </label>

            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md font-bold text-[10px] sm:text-xs md:text-sm transition-all shadow-sm whitespace-nowrap bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
            >
              Ver link
            </a>
          </>
        ) : (
          <span className="flex items-center gap-1 text-green-700 text-[9px] sm:text-[10px] font-extrabold border border-green-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-green-100 uppercase tracking-wider whitespace-nowrap shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            JÁ FOI
          </span>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 p-4 md:p-8 font-sans text-gray-800 selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-10 space-y-4 animate-in slide-in-from-top-10 fade-in duration-700">
          <h1 className="flex flex-col items-center justify-center font-[family-name:var(--font-great-vibes)] drop-shadow-sm">
            <span className="text-4xl md:text-6xl pb-0 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 leading-normal py-1">Casamento</span>
            <span className="text-5xl md:text-8xl pt-0 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 leading-normal py-2 px-2">Jefferson & Erica</span>
          </h1>
          <p className="text-gray-700 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mt-2">
            Sua presença é nosso maior presente!<br />
            Mas se quiser nos mimar, escolha algo especial abaixo!
          </p>

          <div className="pt-2 flex flex-col items-center justify-center gap-6">
            <button
              onClick={() => setShowPixModal(true)}
              className="group flex items-center gap-2 bg-gradient-to-r from-teal-400 to-green-500 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 text-base md:text-lg"
            >
              <span>Presentear com Pix</span>
            </button>
            <div className="bg-white/80 px-6 py-4 rounded-xl border border-pink-200 shadow-sm max-w-lg w-full mt-4">
              <h3 className="text-pink-600 font-bold text-lg mb-1 flex items-center justify-center gap-2 uppercase tracking-wide">
                Endereço para envio
              </h3>
              <p className="text-gray-800 font-medium text-lg leading-relaxed">
                Rua Guilherme Zilmann, 186, Casa 172<br />
                <span className="text-gray-600 font-normal">Joinville - Santa Catarina</span>
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-indigo-400 animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-lg">Preparando tudo com carinho...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              {/* Category Toggle - Centered */}
              <div className="bg-gray-100 p-1 rounded-full inline-flex relative shadow-inner">
                <button
                  onClick={() => setSelectedCategory('essential')}
                  className={`relative z-10 px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${selectedCategory === 'essential' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Presentes Essenciais
                </button>
                <button
                  onClick={() => setSelectedCategory('custom')}
                  className={`relative z-10 px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${selectedCategory === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Presentes Personalizados
                </button>
              </div>

              {/* Sort Buttons - Also Centered below or separate, trying to keep clean */}
              <div className="flex gap-2 justify-center w-full">
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm
                      ${sortOrder === 'desc'
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                >
                  <span>Mais caros</span>
                </button>
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm
                      ${sortOrder === 'asc'
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                >
                  <span>Mais baratos</span>
                </button>
              </div>
            </div>

            {gifts.filter(g => g.category === selectedCategory).length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white">
                <p className="text-xl">
                  {selectedCategory === 'essential' ? 'Lista de essenciais vazia!' : 'Nenhum item personalizado ainda...'}
                </p>
                <p className="text-sm mt-2">Que tal adicionar um?</p>
              </div>
            )}

            {/* Custom Gift Card - Moved to Top */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0 mb-4">
              <button
                onClick={() => {
                  setFormName(''); setFormPhone(''); setFormMessage(''); setCustomGiftName('');
                  setShowCustomGiftModal(true);
                }}
                className="w-full relative px-4 py-2.5 rounded-lg border-2 border-dashed border-pink-300 bg-white/50 hover:bg-white/80 transition-all duration-300 group flex items-center justify-center gap-3 hover:border-pink-500 hover:shadow-md cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-gray-700 group-hover:text-pink-700 transition-colors">Adicionar Presente Personalizado</h3>
                  <p className="text-xs text-gray-500">Não encontrou o que queria? Clique aqui!</p>
                </div>
              </button>
            </div>

            {[...gifts]
              .filter(gift => gift.category === selectedCategory)
              .sort((a, b) => sortOrder === 'desc' ? b.price - a.price : a.price - b.price)
              .map((gift, index) => (
                <div key={gift.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 30}ms` }}>
                  <GiftCard item={gift} />
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedGift && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-md w-full border border-white/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"></div>

            <h3 className="text-3xl font-extrabold mb-2 text-gray-800 tracking-tight">Oba!</h3>
            <p className="text-gray-600 mb-8 font-medium">
              Você escolheu <strong className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">{selectedGift.name}</strong>. Obrigado!
            </p>

            <form onSubmit={handleConfirmPurchase} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-pink-500 transition-colors">Seu Nome</label>
                <input
                  required type="text"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 outline-none transition-all placeholder:text-gray-300"
                  value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Quem está presenteando?"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-pink-500 transition-colors">WhatsApp</label>
                <input
                  required type="tel"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 outline-none transition-all placeholder:text-gray-300"
                  value={formPhone} onChange={e => setFormPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-pink-500 transition-colors">Mensagem de Carinho</label>
                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium h-28 focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 outline-none resize-none transition-all placeholder:text-gray-300"
                  value={formMessage} onChange={e => setFormMessage(e.target.value)}
                  placeholder="Escreva algo especial para os noivos..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setSelectedGift(null)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomGiftModal && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-md w-full border border-white/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400"></div>

            <h3 className="text-3xl font-extrabold mb-2 text-gray-800 tracking-tight">Algo Especial!</h3>
            <p className="text-gray-600 mb-8 font-medium">
              Que ideia incrível! Conte para nós o que você gostaria de dar.
            </p>

            <form onSubmit={handleCreateCustomGift} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-teal-500 transition-colors">O que é o presente?</label>
                <input
                  required type="text"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-gray-300"
                  value={customGiftName} onChange={e => setCustomGiftName(e.target.value)}
                  placeholder="Ex: Jantar, Passeio de Barco..."
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-teal-500 transition-colors">Seu Nome</label>
                <input
                  required type="text"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-gray-300"
                  value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-teal-500 transition-colors">WhatsApp</label>
                <input
                  required type="tel"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-gray-300"
                  value={formPhone} onChange={e => setFormPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-teal-500 transition-colors">Mensagem</label>
                <textarea
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium h-28 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none resize-none transition-all placeholder:text-gray-300"
                  value={formMessage} onChange={e => setFormMessage(e.target.value)}
                  placeholder="Mande boas vibes junto com o presente!"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setShowCustomGiftModal(false)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adicionar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPixModal && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-sm w-full border border-white/50 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500"></div>

            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-3xl">
              💸
            </div>

            <h3 className="text-2xl font-extrabold mb-2 text-gray-800 tracking-tight">Presente via Pix</h3>
            <p className="text-gray-600 mb-6 font-medium text-sm">
              Escaneie o QR Code ou copie a chave abaixo para enviar seu presente!
            </p>

            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 mb-6 inline-block shadow-sm">
              <QRCode
                value="ericabel2603@gmail.com"
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-6 flex items-center justify-between border border-gray-200">
              <span className="text-sm font-mono text-gray-600 truncate mr-2 select-all">ericabel2603@gmail.com</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('ericabel2603@gmail.com');
                  alert('Chave Pix copiada!');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                COPIAR
              </button>
            </div>

            <button
              onClick={() => setShowPixModal(false)}
              className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Gift = {
  id: number;
  name: string;
  price: number;
  link: string;
  available: boolean;
};

const PRICE_THRESHOLD = 200;

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCustomGiftModal, setShowCustomGiftModal] = useState(false);
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
      relative p-6 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl flex flex-col justify-between gap-4 transition-all duration-500 group
      ${!item.available ? 'opacity-70 grayscale-[0.8] bg-gray-100/80 saturate-0' : 'hover:-translate-y-2 hover:scale-[1.02] border-2 border-transparent hover:border-pink-300'}
    `}>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <span className={`font-bold text-xl text-gray-800 ${!item.available ? 'line-through text-gray-400' : 'group-hover:text-pink-600 transition-colors'}`}>
            {item.name}
          </span>
          {item.available ? (
            <div className="relative transform transition-transform duration-300 hover:scale-110" title="Marcar para presentear">
              <input
                type="checkbox"
                className="appearance-none w-7 h-7 border-2 border-pink-300 rounded-full checked:bg-gradient-to-r checked:from-pink-500 checked:to-rose-500 checked:border-transparent cursor-pointer transition-all shadow-sm"
                checked={false}
                onChange={() => {
                  setFormName(''); setFormPhone(''); setFormMessage('');
                  setSelectedGift(item);
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 font-bold text-sm">
                ✓
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-[10px] font-extrabold border border-gray-300 px-2 py-1 rounded-full bg-gray-200 uppercase tracking-wider whitespace-nowrap shadow-inner">
              JÁ FOI
            </span>
          )}
        </div>

        <span className="text-gray-600 font-bold text-lg">
          {formatMoney(item.price)}
        </span>
      </div>

      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full text-center py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-md
          ${item.available
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-800 hover:shadow-lg'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none shadow-none'}
        `}
      >
        {item.available ? 'Ver link do presente' : 'Indisponível'}
      </a>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 p-6 md:p-12 font-sans text-gray-800 selection:bg-pink-200 selection:text-pink-900 overflow-x-hidden">

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-200 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-16 space-y-6 animate-in slide-in-from-top-10 fade-in duration-700">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 drop-shadow-sm">
            Casamento Jefferson e Érica
          </h1>
          <p className="text-gray-700 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Sua presença é nosso maior presente!<br />
            Mas se quiser nos mimar, escolha algo especial abaixo!
          </p>

          <div className="pt-6">
            <button
              onClick={() => {
                setFormName(''); setFormPhone(''); setFormMessage(''); setCustomGiftName('');
                setShowCustomGiftModal(true);
              }}
              className="group relative inline-flex items-center gap-3 bg-white hover:bg-white/90 text-gray-800 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-pink-300/50 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 border border-pink-100"
            >
              <span>Seu presente não está na lista? Adicione aqui!</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-indigo-400 animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-lg">Preparando tudo com carinho...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 perspective-1000">
            {gifts.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500 bg-white/60 backdrop-blur-md rounded-3xl shadow-lg border border-white">
                <p className="text-xl">Ainda não escolhemos os presentes...</p>
                <p className="text-sm mt-2">Mas aceitamos abraços!</p>
              </div>
            )}
            {gifts.map((gift, index) => (
              <div key={gift.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
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
    </main>
  );
}
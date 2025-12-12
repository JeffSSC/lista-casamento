'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Tipo atualizado (sem imagem)
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

  // Estados do Modal
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca dados iniciais
  const fetchGifts = async () => {
    const { data, error } = await supabase.from('gifts').select('*').order('price', { ascending: false });

    // ADICIONE ISSO AQUI:
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
    // Atualização em tempo real (opcional)
    const subscription = supabase.channel('gifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, fetchGifts)
      .subscribe();
    return () => { subscription.unsubscribe(); }
  }, []);

  // Função de Confirmar Compra
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

  const expensiveGifts = gifts.filter(g => g.price >= PRICE_THRESHOLD);
  const cheapGifts = gifts.filter(g => g.price < PRICE_THRESHOLD);
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- CARD COMPACTO (Sem Imagem) ---
  const GiftCard = ({ item, type }: { item: Gift, type: 'gold' | 'silver' }) => (
    <div className={`
      relative p-5 rounded-2xl bg-white flex items-center justify-between gap-4 transition-all duration-300 group/card
      ${!item.available ? 'opacity-50 grayscale bg-gray-100' : 'hover:-translate-y-1 hover:shadow-xl shadow-md'}
      ${type === 'gold' ? 'border-l-[6px] border-amber-400' : 'border-l-[6px] border-slate-300'} 
    `}>

      {/* Esquerda: Checkbox + Informações */}
      <div className="flex items-center gap-4 flex-1">
        {item.available ? (
          <div className="relative group">
            <div className="relative">
              <input
                type="checkbox"
                className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md checked:bg-green-500 checked:border-green-500 cursor-pointer transition-colors"
                checked={false}
                onChange={() => {
                  setFormName(''); setFormPhone(''); setFormMessage('');
                  setSelectedGift(item);
                }}
              />
              <svg className="absolute w-4 h-4 text-white top-1 left-1 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            {/* Tooltip simples */}
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded shadow-lg">
              Marcar como comprado
            </span>
          </div>
        ) : (
          <span className="text-gray-500 font-mono text-xs font-bold border border-gray-300 px-2 py-0.5 rounded bg-gray-100 uppercase tracking-wide">
            Comprado
          </span>
        )}

        <div className="flex flex-col">
          <span className={`font-semibold text-lg leading-tight ${!item.available ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {item.name}
          </span>
          <span className={`text-sm font-bold mt-1 ${type === 'gold' ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatMoney(item.price)}
          </span>
        </div>
      </div>

      {/* Direita: Link da Loja */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap flex items-center gap-1
          ${item.available
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'}
        `}
      >
        {item.available ? (
          <>Ver na Loja <span className="text-xs">↗</span></>
        ) : (
          'Indisponível'
        )}
      </a>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 md:p-12 font-sans selection:bg-pink-300 selection:text-pink-900">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight mb-3">
            Lista de Presentes
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Selecione a caixinha se você comprou o presente para nós ❤️
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50 animate-pulse">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-medium">Carregando lista...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">

            {/* Coluna 1 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/20 mb-4">
                <span className="text-2xl filter drop-shadow">✨</span>
                <h2 className="text-2xl font-bold text-white shadow-sm tracking-wide">
                  Destaques
                </h2>
              </div>
              {expensiveGifts.length === 0 && <p className="text-white/60 text-center py-4 bg-white/10 rounded-lg backdrop-blur-sm">Nenhum item nesta lista.</p>}
              {expensiveGifts.map(gift => <GiftCard key={gift.id} item={gift} type="gold" />)}
            </section>

            {/* Coluna 2 */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/20 mb-4">
                <span className="text-2xl filter drop-shadow">🎁</span>
                <h2 className="text-2xl font-bold text-white shadow-sm tracking-wide">
                  Lembranças
                </h2>
              </div>
              {cheapGifts.length === 0 && <p className="text-white/60 text-center py-4 bg-white/10 rounded-lg backdrop-blur-sm">Nenhum item nesta lista.</p>}
              {cheapGifts.map(gift => <GiftCard key={gift.id} item={gift} type="silver" />)}
            </section>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedGift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <h3 className="text-2xl font-bold text-gray-800 mb-1">Confirmar Compra</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Que demais! Você vai presentear os noivos com <strong className="text-purple-600">{selectedGift.name}</strong>?
            </p>

            <form onSubmit={handleConfirmPurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Seu Nome</label>
                <input
                  required type="text"
                  className="w-full border text-gray-600 border-gray-200 bg-gray-50 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none transition-all"
                  value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Tio João"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Telefone / WhatsApp</label>
                <input
                  required type="tel"
                  className="w-full border text-gray-600 border-gray-200 bg-gray-50 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none transition-all"
                  value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Recado aos noivos</label>
                <textarea
                  className="w-full border text-gray-600 border-gray-200 bg-gray-50 rounded-lg p-3 h-24 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none resize-none transition-all"
                  value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="Deixe uma mensagem carinhosa..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setSelectedGift(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Presente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
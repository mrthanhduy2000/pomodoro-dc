import golden from './assets/hoian-golden.png';
import night from './assets/hoian-night.png';

/** Illustrated atmosphere, never a rendering of the user's earned buildings. */
export default function ScenicView({ appearance, now }) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', hourCycle: 'h23' }).format(new Date(now)));
  const evening = appearance.light === 'night' || (appearance.light === 'live' && (hour < 6 || hour >= 18));
  return <figure className="gpt-scenic-view"><img src={evening ? night : golden} alt={`Cảnh minh họa phố cổ Hội An ${evening ? 'lên đèn' : 'chiều vàng'}, nhà ven sông và đèn lồng`} decoding="async" fetchPriority="high" /><figcaption>Hội An · {evening ? 'Phố lên đèn' : 'Chiều bên sông'} <span>· Cảnh minh họa</span></figcaption></figure>;
}

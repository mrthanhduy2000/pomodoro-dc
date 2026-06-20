/**
 * FocusCoachMobile — thẻ AI Coach gọn cho màn Tập trung trên ĐIỆN THOẠI.
 * (Thẻ Coach ở cột phải chỉ hiện trên màn rộng `lg`, nên iPhone không thấy nó.)
 * Chỉ hiện khi CHƯA chạy phiên — để không phá màn "Focus tĩnh khi chạy".
 * Dùng chung logic qua useCoachInsight (phân tích) + useCoachVoice (giọng nói).
 */
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import useCoachInsight from '../hooks/useCoachInsight';
import useCoachVoice from '../hooks/useCoachVoice';
import CoachCard from './CoachCard';
import CoachChat from './CoachChat';
import FocusReport from './FocusReport';

export default function FocusCoachMobile({ hidden = false, ...goalProps }) {
  const coach = useCoachInsight(goalProps);
  const coachPersonality = useSettingsStore((s) => s.coachPersonality);
  const setCoachPersonality = useSettingsStore((s) => s.setCoachPersonality);

  const {
    sessionsCompletedToday = 0,
    focusMinutesToday = 0,
    dailyGoalType = 'sessions',
    dailyGoalSessions = 5,
    dailyGoalMinutes = 125,
  } = goalProps;
  const useMinutes = dailyGoalType === 'minutes';
  const goalValue = useMinutes ? dailyGoalMinutes : dailyGoalSessions;
  const currentValue = useMinutes ? focusMinutesToday : sessionsCompletedToday;
  const goalMet = goalValue > 0 && currentValue >= goalValue;

  const voice = useCoachVoice({ sessionsCompletedToday, focusMinutesToday, goalMet });

  if (hidden) return null;
  return (
    <div className="mt-4 lg:hidden">
      <CoachCard
        text={voice.message}
        reason={coach.text || coach.reason}
        tone={voice.tone}
        personality={coachPersonality}
        onPersonalityChange={setCoachPersonality}
      />
      <CoachChat {...goalProps} />
      <FocusReport {...goalProps} />
    </div>
  );
}

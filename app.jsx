import React, { useState, useEffect, useMemo, useRef } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import {
  Check, ChevronDown, ChevronUp, Pencil, Save,
  ClipboardList, BarChart3, Lightbulb, Zap,
  Trophy, Briefcase, HeartPulse, Wallet, BookOpen, RefreshCw,
} from 'https://esm.sh/lucide-react@0.294.0?deps=react@18.2.0';
import { supabase, supabaseConfigured } from './supabaseClient.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
// Distinct pastel per day for the Weekly Reflection headers.
const DAY_PASTELS = { Mon: '#FBD9C4', Tue: '#DCD3F7', Wed: '#CDEFE0', Thu: '#FBEBB5', Fri: '#F8D6E0', Sat: '#E7DAC9' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CORAL = '#F2703F';
const INK = '#3A2E28';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(monday) {
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function TaskCard({ task, dayFull, onToggleDone, onNameChange, onFieldChange, onSaveDone }) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(task.task_name);

  useEffect(() => {
    if (!editingName) setNameDraft(task.task_name);
  }, [task.task_name, editingName]);

  const hasNotes = task.insights.trim() || task.actions.trim();
  const borderClass = task.is_done ? 'border-[#4CAF7D]' : hasNotes ? 'border-[#F2703F]' : 'border-[#F0E4D8]';

  function commitName() {
    const val = nameDraft.trim();
    setEditingName(false);
    if (val !== task.task_name) onNameChange(val);
  }

  const showInput = task.task_name === '' || editingName;

  return (
    <div className={`bg-white rounded-3xl border-2 ${borderClass} transition-colors duration-300 shadow-sm shadow-[#f0e4d8]/40 mb-3`}>
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggleDone}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            task.is_done ? 'bg-[#4CAF7D]' : 'bg-white border-2 border-[#E8DFD3]'
          }`}
          aria-label="Toggle done"
        >
          {task.is_done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          {showInput ? (
            <input
              autoFocus={editingName}
              value={editingName ? nameDraft : task.task_name}
              onChange={(e) => (editingName ? setNameDraft(e.target.value) : onNameChange(e.target.value))}
              onBlur={editingName ? commitName : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingName) commitName();
                  else e.target.blur();
                }
              }}
              placeholder={`Enter task ${task.slot} for ${dayFull}...`}
              className="w-full border-b-2 border-[#F0E4D8] focus:border-[#F2703F] outline-none py-1 text-[#3A2E28] bg-transparent font-medium placeholder:text-[#C9BCAE] placeholder:font-normal"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className={`truncate font-semibold ${task.is_done ? 'line-through text-[#C9BCAE]' : 'text-[#3A2E28]'}`}>
                {task.task_name}
              </span>
              <button
                onClick={() => setEditingName(true)}
                className="shrink-0 w-6 h-6 rounded-full bg-[#FBF3EC] flex items-center justify-center hover:bg-[#F5E6D8] transition-colors"
                aria-label="Edit task name"
              >
                <Pencil className="w-3 h-3 text-[#B08968]" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded((x) => !x)}
          className="shrink-0 w-8 h-8 rounded-full bg-[#FBF3EC] flex items-center justify-center text-[#B08968] hover:bg-[#F5E6D8] transition-colors"
          aria-label="Expand"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#8B7B6B] mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#FDE7B8] flex items-center justify-center">
                <Lightbulb className="w-3 h-3 text-[#B08430]" />
              </span>
              Key Insights / Learnings
            </label>
            <textarea
              value={task.insights}
              onChange={(e) => onFieldChange('insights', e.target.value)}
              placeholder="What did you learn or discover from this activity?"
              rows={2}
              className="w-full text-sm bg-[#FDF7F2] border-none rounded-2xl p-3 focus:ring-2 focus:ring-[#F2703F]/40 outline-none resize-none placeholder:text-[#C9BCAE]"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#8B7B6B] mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#CDEFE0] flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#2E9E68]" />
              </span>
              Actions Taken &amp; Outcomes
            </label>
            <textarea
              value={task.actions}
              onChange={(e) => onFieldChange('actions', e.target.value)}
              placeholder="What did you actually do? What was the result or output?"
              rows={2}
              className="w-full text-sm bg-[#FDF7F2] border-none rounded-2xl p-3 focus:ring-2 focus:ring-[#F2703F]/40 outline-none resize-none placeholder:text-[#C9BCAE]"
            />
          </div>
          <button
            onClick={() => {
              onSaveDone();
              setExpanded(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#1C1C1E] hover:opacity-90 text-white font-semibold py-3 rounded-full transition-opacity"
          >
            <Save className="w-4 h-4" /> Save &amp; Mark Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DailyLogView({ activeDay, setActiveDay, weekDays, tasks, onToggleDone, onNameChange, onFieldChange, onSaveDone }) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {DAYS.map((day, i) => {
          const done = tasks[day].filter((t) => t.is_done).length;
          const active = day === activeDay;
          const complete = done === 3;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`shrink-0 flex flex-col items-center justify-center rounded-3xl transition-all duration-200 ${
                active ? 'px-5 py-4 shadow-lg scale-105' : 'px-4 py-3 shadow-sm'
              }`}
              style={active ? { backgroundColor: CORAL, color: 'white' } : { backgroundColor: 'white', color: INK }}
            >
              <span className="text-xs font-bold uppercase tracking-wide">{day}</span>
              <span className={`text-[10px] mt-0.5 ${active ? 'text-white/80' : 'text-[#B0A498]'}`}>{formatDate(weekDays[i])}</span>
              {complete ? (
                <span className={`mt-1.5 w-4 h-4 rounded-full flex items-center justify-center ${active ? 'bg-white/25' : 'bg-[#CDEFE0]'}`}>
                  <Check className={`w-2.5 h-2.5 ${active ? 'text-white' : 'text-[#2E9E68]'}`} strokeWidth={3} />
                </span>
              ) : (
                <span className={`text-[10px] mt-1.5 font-semibold ${active ? 'text-white/90' : 'text-[#B0A498]'}`}>{done}/3</span>
              )}
            </button>
          );
        })}
      </div>
      <div>
        {tasks[activeDay].map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            dayFull={DAY_NAMES[activeDay]}
            onToggleDone={() => onToggleDone(activeDay, task.slot)}
            onNameChange={(val) => onNameChange(activeDay, task.slot, val)}
            onFieldChange={(field, val) => onFieldChange(activeDay, task.slot, field, val)}
            onSaveDone={() => onSaveDone(activeDay, task.slot)}
          />
        ))}
      </div>
    </div>
  );
}

function ReflectionView({ weekDays, tasks }) {
  return (
    <div className="space-y-5">
      {DAYS.map((day, i) => (
        <div key={day} className="rounded-3xl overflow-hidden bg-white shadow-sm">
          <div style={{ backgroundColor: DAY_PASTELS[day] }} className="px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-[#3A2E28]">{DAY_NAMES[day]}</span>
            <span className="text-sm font-medium text-[#3A2E28]/70">{formatDate(weekDays[i])}</span>
          </div>
          <div className="p-4 space-y-4">
            {tasks[day].map((task) => {
              const hasInsight = task.insights && task.insights.trim();
              const hasAction = task.actions && task.actions.trim();
              return (
                <div key={task.id} className="border-b border-[#F5EEE6] last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{task.is_done ? '✅' : '⬜'}</span>
                    <span className={`font-semibold ${task.task_name ? 'text-[#3A2E28]' : 'text-[#C9BCAE] italic'}`}>
                      {task.task_name || `Task ${task.slot} (untitled)`}
                    </span>
                  </div>
                  {!hasInsight && !hasAction && <p className="text-sm italic text-[#C9BCAE] ml-6">No notes recorded</p>}
                  {hasInsight && (
                    <div className="ml-6 mb-2 pl-3 border-l-4 border-[#FDE7B8] bg-[#FFF9EE] rounded-r-2xl py-2 pr-2">
                      <p className="text-xs font-bold text-[#B08430] mb-0.5">Insight</p>
                      <p className="text-sm text-[#5C5148] whitespace-pre-wrap">{task.insights}</p>
                    </div>
                  )}
                  {hasAction && (
                    <div className="ml-6 pl-3 border-l-4 border-[#CDEFE0] bg-[#F3FBF7] rounded-r-2xl py-2 pr-2">
                      <p className="text-xs font-bold text-[#2E9E68] mb-0.5">Action</p>
                      <p className="text-sm text-[#5C5148] whitespace-pre-wrap">{task.actions}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const CATEGORY_META = {
  Business: { icon: Briefcase, badge: '#FBD9C4', iconColor: '#C77B4F' },
  Health: { icon: HeartPulse, badge: '#F8D6E0', iconColor: '#D6577E' },
  Finance: { icon: Wallet, badge: '#CDEFE0', iconColor: '#2E9E68' },
  Learning: { icon: BookOpen, badge: '#DCD3F7', iconColor: '#7B67C4' },
};

function AchievementsView({ weekStartISO }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadedForWeek = useRef(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('weekly-achievements', {
        body: { week_start: weekStartISO },
      });
      if (fnError) {
        let message = fnError.message;
        if (fnError.context && typeof fnError.context.json === 'function') {
          try {
            const body = await fnError.context.json();
            if (body && body.error) message = body.error;
          } catch (_) {
            // response body wasn't JSON; fall back to the generic message
          }
        }
        throw new Error(message);
      }
      if (res && res.error) throw new Error(res.error);
      setData(res);
      loadedForWeek.current = weekStartISO;
    } catch (e) {
      setError(e.message || 'Failed to generate achievements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadedForWeek.current !== weekStartISO) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartISO]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#3A2E28]">This Week's Achievements</h2>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#C77B4F] bg-white px-3 py-2 rounded-full shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Regenerate
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-white border-2 border-[#F2703F]/30 text-[#C0392B] rounded-2xl text-sm">{error}</div>
      )}

      {loading && !data ? (
        <div className="text-center text-[#B0A498] py-20">Asking AI to review your week…</div>
      ) : data ? (
        <div className="space-y-4">
          {Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const items = data[cat] || [];
            const Icon = meta.icon;
            return (
              <div key={cat} className="bg-white rounded-3xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.badge }}>
                    <Icon className="w-4 h-4" style={{ color: meta.iconColor }} />
                  </span>
                  <span className="font-bold text-[#3A2E28]">{cat}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm italic text-[#C9BCAE] ml-10">No achievements yet this week</p>
                ) : (
                  <ul className="space-y-2 ml-10">
                    {items.map((item, i) => (
                      <li key={i} className="text-sm text-[#5C5148] flex gap-2">
                        <span className="font-bold shrink-0" style={{ color: meta.iconColor }}>{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Header({ weekDays, percent, totalDone }) {
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  const label = sameMonth
    ? `${first.getDate()} – ${last.getDate()} ${MONTHS[first.getMonth()]} ${first.getFullYear()}`
    : `${formatDate(first)} – ${formatDate(last)} ${last.getFullYear()}`;

  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <p className="text-sm font-semibold text-[#C77B4F] mb-1">Week of {label}</p>
        <h1 className="text-3xl font-extrabold text-[#3A2E28] leading-tight">Weekly Activity Tracker</h1>
      </div>
      <div className="shrink-0 flex flex-col items-center bg-white rounded-2xl shadow-sm px-4 py-3">
        <span className="text-2xl font-extrabold" style={{ color: CORAL }}>{percent}%</span>
        <span className="text-[11px] text-[#B0A498] font-semibold whitespace-nowrap">{totalDone}/18 done</span>
      </div>
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="h-2.5 w-full bg-white rounded-full shadow-inner overflow-hidden mb-6">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${CORAL}, #FDB768)` }}
      />
    </div>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { key: 'daily', label: 'Daily Log', Icon: ClipboardList },
    { key: 'reflection', label: 'Reflection', Icon: BarChart3 },
    { key: 'achievements', label: 'Wins', Icon: Trophy },
  ];
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-[#1C1C1E] rounded-full shadow-xl flex items-center gap-1.5 p-1.5">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
              view === key ? 'text-white' : 'text-[#8A8A8D] hover:text-white'
            }`}
            style={view === key ? { backgroundColor: CORAL } : undefined}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [tasks, setTasks] = useState(null);
  const [activeDay, setActiveDay] = useState('Mon');
  const [view, setView] = useState('daily');
  const [error, setError] = useState(null);

  const timersRef = useRef({});
  const pendingRef = useRef({});

  const weekStartISO = useMemo(() => toISODate(weekStart), [weekStart]);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setTasks(null);
      setError(null);
      try {
        let { data, error: fetchErr } = await supabase.from('weekly_tasks').select('*').eq('week_start', weekStartISO);
        if (fetchErr) throw fetchErr;

        if (!data || data.length === 0) {
          const rows = [];
          for (const day of DAYS) {
            for (let slot = 1; slot <= 3; slot++) {
              rows.push({ week_start: weekStartISO, day, slot, task_name: '', insights: '', actions: '', is_done: false });
            }
          }
          const { data: inserted, error: insertErr } = await supabase.from('weekly_tasks').insert(rows).select();
          if (insertErr) throw insertErr;
          data = inserted;
        }

        if (cancelled) return;
        const byDay = {};
        for (const day of DAYS) byDay[day] = data.filter((r) => r.day === day).sort((a, b) => a.slot - b.slot);
        setTasks(byDay);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load data from Supabase.');
      }
    }

    if (supabaseConfigured) {
      load();
    } else {
      setError('Supabase is not configured yet — add your project URL and anon key in supabaseClient.js.');
    }

    return () => {
      cancelled = true;
    };
  }, [weekStartISO]);

  useEffect(() => {
    function checkWeek() {
      const m = getMonday(new Date());
      if (toISODate(m) !== toISODate(weekStart)) setWeekStart(m);
    }
    const interval = setInterval(checkWeek, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', checkWeek);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkWeek);
    };
  }, [weekStart]);

  function scheduleSave(id, fields) {
    pendingRef.current[id] = { ...(pendingRef.current[id] || {}), ...fields };
    clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(() => flushSave(id), 800);
  }

  async function flushSave(id, extra) {
    clearTimeout(timersRef.current[id]);
    const merged = { ...(pendingRef.current[id] || {}), ...(extra || {}) };
    delete pendingRef.current[id];
    if (Object.keys(merged).length === 0) return;
    const { error: saveErr } = await supabase.from('weekly_tasks').update(merged).eq('id', id);
    if (saveErr) setError(saveErr.message);
  }

  function updateField(day, slot, field, value) {
    const task = tasks[day].find((t) => t.slot === slot);
    setTasks((prev) => ({ ...prev, [day]: prev[day].map((t) => (t.slot === slot ? { ...t, [field]: value } : t)) }));
    scheduleSave(task.id, { [field]: value });
  }

  function toggleDone(day, slot) {
    const task = tasks[day].find((t) => t.slot === slot);
    const newVal = !task.is_done;
    setTasks((prev) => ({ ...prev, [day]: prev[day].map((t) => (t.slot === slot ? { ...t, is_done: newVal } : t)) }));
    flushSave(task.id, { is_done: newVal });
  }

  function saveDone(day, slot) {
    const task = tasks[day].find((t) => t.slot === slot);
    setTasks((prev) => ({ ...prev, [day]: prev[day].map((t) => (t.slot === slot ? { ...t, is_done: true } : t)) }));
    flushSave(task.id, { task_name: task.task_name, insights: task.insights, actions: task.actions, is_done: true });
  }

  const totalDone = tasks ? DAYS.reduce((sum, d) => sum + tasks[d].filter((t) => t.is_done).length, 0) : 0;
  const percent = tasks ? Math.round((totalDone / 18) * 100) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#FDECE1' }}>
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: '#C9B8F5' }} />
      <div className="pointer-events-none absolute top-40 -left-28 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: '#FDB768' }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-28">
        <Header weekDays={weekDays} percent={percent} totalDone={totalDone} />
        <ProgressBar percent={percent} />

        {error && (
          <div className="mb-4 p-3 bg-white border-2 border-[#F2703F]/30 text-[#C0392B] rounded-2xl text-sm">{error}</div>
        )}

        {!tasks ? (
          <div className="text-center text-[#B0A498] py-20">Loading…</div>
        ) : view === 'daily' ? (
          <DailyLogView
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            weekDays={weekDays}
            tasks={tasks}
            onToggleDone={toggleDone}
            onNameChange={(day, slot, val) => updateField(day, slot, 'task_name', val)}
            onFieldChange={updateField}
            onSaveDone={saveDone}
          />
        ) : view === 'reflection' ? (
          <ReflectionView weekDays={weekDays} tasks={tasks} />
        ) : (
          <AchievementsView weekStartISO={weekStartISO} />
        )}
      </div>

      <BottomNav view={view} setView={setView} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

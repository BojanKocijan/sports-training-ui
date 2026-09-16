import type { CategoryId } from './categories'
import type { SportId } from './sports'
import { DEFAULT_SPORT_ID } from './sports'

export interface Cue {
  nl: string
  en: string
}

export interface Exercise {
  id: string
  emoji: string
  title: string
  subtitle?: string
  /** What this exercise trains — used to build a focused training around a theme. */
  categories: CategoryId[]
  /** Suggested duration in minutes when run at its default pace. */
  durationMinutes: number
  goal: string
  steps: string[]
  cues?: Cue[]
  /** A break isn't a "graded" exercise — hidden from rating/library filtering by default. */
  isBreak?: boolean
  /** Group-template ids (see group_templates, e.g. 'u8'/'u10') this exercise is appropriate
   * for. Omitted = applies to every group — most exercises are shared fundamentals; only tag
   * this when an exercise's framing (age-appropriate content, difficulty) is group-specific. */
  groups?: string[]
}

/** Exercise library, per sport — basketball is the only sport with content today. Add a new
 * key here when a sport (see ./sports) actually gets its own exercises. */
const EXERCISES_BY_SPORT: Record<SportId, Exercise[]> = {
  basketball: [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome circle',
    categories: ['warmup'],
    durationMinutes: 5,
    goal: 'Learn names, set the tone, agree on rules.',
    groups: ['u8'],
    steps: [
      'Children place one foot on a ball, or hold it still.',
      'Say: "Welkom! Vandaag gaan we spelen, dribbelen, passen en schieten." / "Welcome! Today we’ll play, dribble, pass and shoot."',
      'Introduce both coaches.',
      'Each child says their name and their favourite animal.',
      'Explain three team rules: Stop signal (hand up, "Freeze! / Stop!"), Be kind ("We helpen elkaar."), Have fun (mistakes are allowed).',
      'Quick parent message: "Vandaag draait vooral om plezier, veiligheid en iedereen veel met de bal laten spelen. Aan het einde mogen jullie luid aanmoedigen!"',
    ],
    cues: [
      { nl: 'Welkom!', en: 'Welcome!' },
      { nl: 'Stop / bevries', en: 'Stop / freeze' },
      { nl: 'We helpen elkaar', en: 'We help each other' },
    ],
  },
  {
    id: 'wall-of-china',
    emoji: '🧱',
    title: 'Wall of china',
    categories: ['warmup', 'agility'],
    durationMinutes: 5,
    goal: 'Warm up, run around, have fun as a group.',
    groups: ['u8'],
    steps: [
      'Pick one child to be the "tagger" who tries to tag other players.',
      'When the tagger tags someone, they join hands and try to tag other players together.',
      'The wall gets longer and longer as more children are tagged.',
      'When the wall reaches 4 kids long, it splits into two separate walls.',
      'Keep playing until one kid is left untagged.',
    ],
  },
  {
    id: 'mario-jump-crab-cheetah',
    emoji: '🦘',
    title: 'Mario, Jump, Crab, Cheetah',
    subtitle: 'Corner-to-corner movement circuit',
    categories: ['agility', 'warmup'],
    durationMinutes: 5,
    goal: 'Coordination, fun movement patterns, listening for the whistle.',
    groups: ['u8'],
    steps: [
      'Start at corner 1.',
      'Corner 1 → middle line: run while jumping and punching the sky, like Mario.',
      'Middle line → corner 2: two quick running steps, then explode up into one big jump — like a rocket launch!',
      'Corner 2 → corner 3: crab run (low squat).',
      'Corner 3 → corner 4: run as fast as you can, like a cheetah.',
      'Round 1: do the full circuit normally.',
      'Round 2: same circuit, but freeze completely when the whistle blows.',
    ],
  },
  {
    id: 'everybody-dribbles',
    emoji: '⛹️',
    title: 'Everybody dribbles',
    categories: ['dribbling', 'agility'],
    durationMinutes: 5,
    goal: 'Ball familiarity and dribbling control.',
    steps: [
      'Give every child a ball and define a safe playing area.',
      'Round 1 – Ball gevoel (ball feel): move the ball around the body without bouncing — left to right, around the tummy, throw and catch.',
      'Round 2 – Body challenges: call out Low/laag, High/hoog, Other hand/andere hand, Sit down and stand up, Turn around/draai rond.',
      'Round 3 – Traffic lights: dribble corner to corner around the court. Green/groen = dribble forwards, Orange/oranje = dribble backwards, Red/rood = stop the ball and freeze.',
    ],
    cues: [
      { nl: 'Laag', en: 'Low' },
      { nl: 'Hoog', en: 'High' },
      { nl: 'Andere hand', en: 'Other hand' },
      { nl: 'Groen', en: 'Green — forwards' },
      { nl: 'Oranje', en: 'Orange — backwards' },
      { nl: 'Rood', en: 'Red — stop & freeze' },
    ],
  },
  {
    id: 'pogo-bounces',
    emoji: '🐇',
    title: 'Pogo bounces',
    subtitle: 'Pogo jumps drill',
    categories: ['warmup', 'agility'],
    durationMinutes: 4,
    goal: 'Light, springy feet and ankle bounce.',
    groups: ['u8'],
    steps: [
      'Stand tall, feet together, arms relaxed — pretend you have a pogo stick under your feet.',
      'Bounce up and down fast using only your ankles, not big knee bends.',
      'Land soft and quiet on your toes every time, like a bunny.',
      'Bounce for 10 seconds, rest 10 seconds. Repeat 3-4 rounds.',
      'Challenge round: bounce while clapping above your head, or bounce slowly turning in a circle.',
    ],
    cues: [
      { nl: 'Licht! Licht!', en: 'Light! Light!' },
      { nl: 'Op je tenen', en: 'On your toes' },
    ],
  },
  {
    id: 'hot-floor-quick-feet',
    emoji: '🔥',
    title: 'Hot floor',
    subtitle: 'Quick feet drill',
    categories: ['agility', 'warmup'],
    durationMinutes: 4,
    goal: 'Fast feet, staying light and ready.',
    groups: ['u8'],
    steps: [
      'Stand with feet shoulder-width apart, knees soft, on your own spot.',
      'Pretend the floor is burning hot — tap your feet up and down as fast as you can without moving forward.',
      'Stay on your toes, pump your arms like you are running in place.',
      'Go fast for 10 seconds, then freeze completely when the coach shouts "Bevries!".',
      'Repeat 3-4 rounds — see who can freeze the stillest.',
    ],
    cues: [
      { nl: 'Snel, snel, snel!', en: 'Fast, fast, fast!' },
      { nl: 'Bevries!', en: 'Freeze!' },
    ],
  },
  {
    id: 'dynamic-warmup-circuit',
    emoji: '🏃',
    title: 'Dynamic warm-up circuit',
    subtitle: 'High knees, butt-kicks, lunges, lateral shuffles',
    categories: ['warmup', 'agility'],
    durationMinutes: 6,
    goal: 'Raise the heart rate and open up hips/ankles like a real practice warm-up.',
    groups: ['u10'],
    steps: [
      'Line up on the baseline. Down and back on each drill before moving to the next.',
      'High knees: drive knees up fast, pump the arms.',
      'Butt-kicks: heels snap up toward the glutes.',
      'Walking lunge with a torso twist toward the front leg each step.',
      'Lateral shuffle in a low stance, leading with each side on the way back.',
      'Finish with two building-speed strides the length of the court.',
    ],
    cues: [
      { nl: 'Knieën omhoog', en: 'Knees up' },
      { nl: 'Laag blijven', en: 'Stay low' },
    ],
  },
  {
    id: 'reaction-sprint',
    emoji: '🚦',
    title: 'Reaction sprint',
    subtitle: 'Coach-call quick starts',
    categories: ['warmup', 'agility'],
    durationMinutes: 5,
    goal: 'Fast first step off an unpredictable signal — game-speed starts, not a countdown.',
    groups: ['u10'],
    steps: [
      'Players start in an athletic stance on the baseline, facing the coach.',
      'Coach calls a signal at a random moment: a number, a clap, or a color — first move only on the signal.',
      'Sprint to the marked line, jog back, reset stance.',
      'Mix in false signals (a word that is NOT the trigger) to test discipline — no reaction on those.',
      'Rotate through 6-8 reps, resting a few seconds between.',
    ],
    cues: [
      { nl: 'Klaar staan', en: 'Ready position' },
      { nl: 'Nu!', en: 'Go!' },
    ],
  },
  {
    id: 'defensive-slide-ladder',
    emoji: '🛡️',
    title: 'Defensive slide ladder',
    subtitle: 'Lateral slides down the sideline and back',
    categories: ['warmup', 'defense', 'agility'],
    durationMinutes: 5,
    goal: 'Build a low, wide defensive stance into the warm-up instead of adding it later.',
    groups: ['u10'],
    steps: [
      'Start in a low defensive stance on the sideline: knees bent, chest up, arms wide.',
      'Slide sideways to half-court without crossing your feet or standing up.',
      'Sprint the rest of the way to the far baseline, then jog back.',
      'Repeat leading with the other foot on the way down.',
      'Coach checks stance height and foot-crossing, not just speed.',
    ],
    cues: [
      { nl: 'Voeten niet kruisen', en: "Don't cross your feet" },
      { nl: 'Laag en breed', en: 'Low and wide' },
    ],
  },
  {
    id: 'partner-mirror-drill',
    emoji: '🪞',
    title: 'Partner mirror',
    subtitle: 'Defensive-stance mirroring drill',
    categories: ['warmup', 'defense', 'agility'],
    durationMinutes: 6,
    goal: 'Read-and-react footwork in a defensive stance, warm-up intensity.',
    groups: ['u10'],
    steps: [
      'Pair up, facing each other about two steps apart, both in a defensive stance.',
      'Leader moves side to side, forward and back, at a controlled pace; the partner mirrors it, staying square.',
      'Switch leader every 20-30 seconds.',
      'Progression: leader adds a quick fake direction change to test the mirror.',
      'No ball yet — this is about feet and stance, not hands.',
    ],
    cues: [
      { nl: 'Blijf op gelijke hoogte', en: 'Stay level with your partner' },
      { nl: 'Ogen op de heupen', en: 'Eyes on the hips' },
    ],
  },
  {
    id: 'zigzag-sprint',
    emoji: '⚡',
    title: 'Zig-zag sprint',
    subtitle: 'Zig zag speed drill',
    categories: ['agility'],
    durationMinutes: 6,
    goal: 'Change of direction and quick cuts.',
    steps: [
      'Set 4-5 cones in a zig-zag line, a few big steps apart.',
      'Sprint to the first cone, then cut sharply toward the next one — no wide loops around the cones.',
      'Stay low and quick through every turn, all the way to the last cone.',
      'Sprint straight through the finish line at the end.',
      'Race a friend, or race the clock for extra fun.',
    ],
    cues: [
      { nl: 'Bocht!', en: 'Turn!' },
      { nl: 'Laag en snel', en: 'Low and fast' },
    ],
  },
  {
    id: 'break',
    emoji: '🥤',
    title: 'Water break',
    categories: [],
    durationMinutes: 2,
    goal: 'Drink, breathe, reset.',
    steps: ['Send children to the drinking area.', 'Keep it short and calm before regrouping.'],
    cues: [{ nl: 'Drinkpauze', en: 'Water break' }],
    isBreak: true,
  },
  {
    id: 'treasure-dribbling',
    emoji: '💎',
    title: 'Treasure dribbling',
    categories: ['dribbling', 'teamplay'],
    durationMinutes: 8,
    goal: 'Dribbling under light pressure, teamwork, weaker-hand practice.',
    steps: [
      'Put cones or bibs ("the treasure") in the centre. Split children between two home bases.',
      'One child at a time from each team dribbles to the centre, collects one treasure, dribbles back, and high-fives the next player.',
      'Play two or three short rounds. Use the weaker hand for the second round.',
      'Keep score unimportant, or finish with a tie.',
      'If waiting gets long, let two children from each team go at the same time.',
      'Challenge returning players to use their weaker hand. Let beginners carry the treasure while controlling the ball however they can.',
    ],
  },
  {
    id: 'figure-8-tunnel',
    emoji: '♾️',
    title: 'Figure-8 tunnel',
    subtitle: 'Figure 8 ball-handling drill',
    categories: ['dribbling'],
    durationMinutes: 6,
    goal: 'Low, controlled dribbling with both hands.',
    steps: [
      'Stand with feet apart and knees bent — your legs are a tunnel for the ball.',
      'Dribble the ball low, push it through the tunnel from front to back with one hand.',
      'Catch it behind your leg with the other hand and bring it around the outside.',
      'Push it through the tunnel again to the front — keep swapping hands.',
      'Keep going non-stop in a figure-8 (∞) shape around both legs.',
      'Challenge: how many figure-8s can you do in 20 seconds without losing the ball?',
    ],
    cues: [
      { nl: 'Laag blijven', en: 'Stay low' },
      { nl: 'Tunnel!', en: 'Tunnel!' },
    ],
  },
  {
    id: 'passing-partners',
    emoji: '🤝',
    title: 'Passing partners',
    categories: ['passing'],
    durationMinutes: 10,
    goal: 'Chest passing technique and cooperation.',
    steps: [
      'Pair children carefully — ideally a confident child with a newer child. Stand about two large steps apart.',
      'Teach: hands ready like a target, push the ball toward your partner, step toward your partner, call your partner’s name.',
      'Use chest passes first. Allow a bounce pass if it helps a beginner succeed.',
      'Progression: five successful passes → take one step farther apart → pass and move to a new cone.',
      'Challenge: how many good passes can the pair make in 30 seconds?',
      'Do not correct every technical detail — successful cooperation matters most.',
    ],
    cues: [
      { nl: 'Klaar?', en: 'Ready?' },
      { nl: 'Handen klaar', en: 'Hands ready' },
      { nl: 'Stap en duw', en: 'Step and push' },
      { nl: 'Kijk naar je maatje', en: 'Look at your teammate' },
      { nl: 'Goede pass!', en: 'Good pass!' },
    ],
  },
  {
    id: 'shooting-stations',
    emoji: '🏀',
    title: 'Shooting stations',
    categories: ['shooting'],
    durationMinutes: 10,
    goal: 'Everyone shoots, everyone scores, everyone is celebrated.',
    steps: [
      'Split into two groups of four or five. One coach leads each basket.',
      'Station routine: start close to the basket → shoot → collect your own ball → pass to the next child → join the back of the short line.',
      'Use floor markers so children know where to stand.',
      'Simple shooting cue: "Bend, look, push." / "Buig, kijk, duw."',
      'After a few minutes, add a challenge: beginners shoot very close, experienced children take one step back.',
      'Everyone tries to score one basket — celebrate each child’s first basket enthusiastically.',
      'Avoid demanding adult shooting form — success and confidence matter more at this age.',
    ],
    cues: [{ nl: 'Buig, kijk, duw', en: 'Bend, look, push' }],
  },
  {
    id: 'layup-merry-go-round',
    emoji: '🔄',
    title: 'Layup merry-go-round',
    subtitle: 'Mikan drill — both-hands layup practice',
    categories: ['shooting'],
    durationMinutes: 6,
    goal: 'Soft touch layups with both hands, close to the basket.',
    steps: [
      'Stand under the basket, right side of the rim, right foot forward, ball in two hands — no dribble.',
      'Shoot a soft layup off the glass with your right hand.',
      'Catch your own ball before it bounces, and step to the left side of the rim.',
      'Shoot a soft layup off the glass with your left hand.',
      'Keep going non-stop: right, left, right, left — like a merry-go-round.',
      'Challenge: count how many baskets in a row you can make without stopping.',
    ],
    cues: [
      { nl: 'Rechts, links, rechts, links', en: 'Right, left, right, left' },
      { nl: 'Vang je eigen bal', en: 'Catch your own ball' },
    ],
  },
  {
    id: 'mini-game',
    emoji: '🎯',
    title: 'Mini-game: End-zone basketball',
    categories: ['teamplay', 'defense', 'passing', 'shooting'],
    durationMinutes: 7,
    goal: 'Team play, everyone touches the ball.',
    steps: [
      'Play 4-v-4 or 5-v-5 across a small area, using two cone end zones instead of baskets.',
      'A team scores by passing to a teammate standing in the opposing end zone.',
      'Rules: no stealing the ball from someone’s hands; defenders give some space; after receiving the ball, stop and pass; everyone should touch the ball.',
      'Coaches can join in or act as helpers if a team needs support.',
      'Coach lightly — let the game flow. Do not keep a serious score; reset quickly after each point.',
    ],
    cues: [
      { nl: 'Vrij!', en: 'Open!' },
      { nl: 'Passen!', en: 'Pass!' },
      { nl: 'Kijk om je heen', en: 'Look around!' },
      { nl: 'Goed samengespeeld!', en: 'Nice teamwork!' },
      { nl: 'Geef ruimte', en: 'Give space!' },
    ],
  },
  {
    id: 'team-finish',
    emoji: '🎉',
    title: 'Team finish',
    categories: ['teamplay', 'warmup'],
    durationMinutes: 3,
    goal: 'Reflect together and celebrate as a team.',
    steps: [
      'Gather in a circle, balls still on the floor.',
      'Ask: "Wat vond je leuk? / What did you enjoy?"',
      'Ask: "Wie heeft vandaag iets nieuws geprobeerd? / Who tried something new?"',
      'Finish with everyone putting one hand in: "Team on three! Eén, twee, drie — TEAM!"',
      'Invite the children to show parents one favourite move, or take a final group shot while parents cheer.',
    ],
  },
  ],
}

/** Exercise library for the app's current sport. Once a club can run more than one sport at
 * a time, this becomes a lookup by the active group's sportId instead of the default. */
export const exercises: Exercise[] = EXERCISES_BY_SPORT[DEFAULT_SPORT_ID]

export function exercisesForSport(sportId: SportId): Exercise[] {
  return EXERCISES_BY_SPORT[sportId] ?? []
}

export function findExercise(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id)
}

/** Exercises appropriate for a given group template (see group_templates, e.g. 'u8'/'u10') —
 * untagged exercises are shared fundamentals and show for every group. */
export function exercisesForGroup(templateId: string): Exercise[] {
  return exercises.filter((e) => !e.groups || e.groups.includes(templateId))
}

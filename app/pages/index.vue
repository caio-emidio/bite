<script setup lang="ts">
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Other'
type FoodItem = { name: string; quantity: string; unit: string }
type Meal = {
  id: string
  patientId: string
  type: MealType
  time: string
  date: string
  foods: FoodItem[]
  notes?: string
  photo?: string
  hunger?: number
  fullness?: number
}
type ViewName = 'home' | 'diary' | 'explore' | 'profile' | 'dashboard' | 'patients' | 'patient-detail' | 'reports' | 'settings'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const today = new Date()
const dateKey = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}
const todayKey = dateKey(today)
const prettyDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(today)
const weekdayUppercase = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(today).toUpperCase()
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(today)
const greeting = computed(() => {
  const hour = today.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

const role = ref<'patient' | 'dietitian'>('patient')
const activeView = ref<ViewName>('home')
const currentDate = ref(todayKey)
const meals = ref<Meal[]>([
  {
    id: 'm1', patientId: 'caio', type: 'Breakfast', time: '08:32', date: todayKey,
    foods: [
      { name: 'Sourdough toast', quantity: '2', unit: 'slices' },
      { name: 'Scrambled eggs', quantity: '2', unit: 'pieces' },
      { name: 'Coffee with oat milk', quantity: '1', unit: 'cup' }
    ]
  },
  {
    id: 'm2', patientId: 'caio', type: 'Lunch', time: '13:14', date: todayKey,
    foods: [
      { name: 'Grilled chicken', quantity: '150', unit: 'g' },
      { name: 'Brown rice', quantity: '1', unit: 'cup' },
      { name: 'Roasted broccoli', quantity: '1', unit: 'serving' }
    ],
    notes: 'A little extra lemon today.'
  },
  {
    id: 'm3', patientId: 'caio', type: 'Snack', time: '16:42', date: todayKey,
    foods: [
      { name: 'Greek yogurt', quantity: '1', unit: 'cup' },
      { name: 'Blueberries', quantity: '1', unit: 'handful' }
    ]
  },
  {
    id: 'm4', patientId: 'maria', type: 'Breakfast', time: '08:45', date: todayKey,
    foods: [{ name: 'Banana pancakes', quantity: '2', unit: 'pieces' }, { name: 'Strawberries', quantity: '1', unit: 'handful' }]
  },
  {
    id: 'm5', patientId: 'maria', type: 'Lunch', time: '14:18', date: todayKey,
    foods: [{ name: 'Lentil soup', quantity: '1', unit: 'bowl' }, { name: 'Sourdough bread', quantity: '1', unit: 'slice' }],
    notes: 'Made a big pot to share.'
  },
  {
    id: 'm6', patientId: 'john', type: 'Lunch', time: '12:53', date: todayKey,
    foods: [{ name: 'Tuna sandwich', quantity: '1', unit: 'serving' }, { name: 'Cucumber', quantity: '1', unit: 'handful' }]
  },
  {
    id: 'm7', patientId: 'john', type: 'Dinner', time: '20:03', date: todayKey,
    foods: [{ name: 'Pasta with tomato sauce', quantity: '1', unit: 'bowl' }, { name: 'Side salad', quantity: '1', unit: 'serving' }]
  }
])

const foodGroups = [
  { name: 'Fruits', count: 8, symbol: '◉', color: 'coral', examples: 'Blueberries, apple, mango' },
  { name: 'Vegetables', count: 11, symbol: '✳', color: 'green', examples: 'Broccoli, spinach, carrots' },
  { name: 'Protein', count: 7, symbol: '✦', color: 'yellow', examples: 'Eggs, chicken, lentils' },
  { name: 'Grains', count: 6, symbol: '◌', color: 'blue', examples: 'Oats, sourdough, rice' }
]

const patients = [
  { id: 'caio', name: 'Caio Emidio', initials: 'CE', color: 'sage', focus: 'Building a relaxed breakfast routine', last: 'Today · 16:42', meals: 3, weight: '89.0 kg', height: '178 cm', age: '29', reason: 'More energy throughout the day', email: 'caio@example.com' },
  { id: 'maria', name: 'Maria Santos', initials: 'MS', color: 'peach', focus: 'Exploring new lunch ideas', last: 'Today · 14:18', meals: 4, weight: '64.2 kg', height: '165 cm', age: '34', reason: 'Support with mindful eating', email: 'maria@example.com' },
  { id: 'john', name: 'John Miller', initials: 'JM', color: 'lavender', focus: 'Finding a good rhythm with snacks', last: 'Yesterday · 20:03', meals: 2, weight: '81.6 kg', height: '182 cm', age: '42', reason: 'Improve energy and meal consistency', email: 'john@example.com' }
]
const selectedPatient = ref(patients[0]!)
const dietitianRange = ref<'Today' | 'Week' | 'Calendar'>('Week')

const logOpen = ref(false)
const logStep = ref(1)
const editingId = ref<string | null>(null)
const formType = ref<MealType>('Breakfast')
const formTime = ref('')
const formFoods = ref<FoodItem[]>([])
const formNotes = ref('')
const formPhoto = ref('')
const formHunger = ref<number | null>(null)
const formFullness = ref<number | null>(null)
const formError = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const xp = ref(1240)
const xpFeedback = ref('')
let xpFeedbackTimeout: ReturnType<typeof setTimeout> | undefined
const expandedMealId = ref<string | null>(null)
const printAllDetails = ref(false)
const profileEditing = ref(false)
const showMeasurementInput = ref(false)
const measurementValue = ref('')
const profile = ref({ name: 'Caio Emidio', dateOfBirth: '1997-05-14', height: '178', weight: '89.0', reason: 'More energy throughout the day' })
const dialogRef = ref<HTMLElement | null>(null)
const focusReturn = ref<HTMLElement | null>(null)

const isDietitian = computed(() => role.value === 'dietitian')
const todayMeals = computed(() => meals.value.filter(meal => meal.patientId === 'caio' && meal.date === currentDate.value).sort((a, b) => a.time.localeCompare(b.time)))
const groupedToday = computed(() => {
  const order: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Other']
  return order.map(type => ({ type, meals: todayMeals.value.filter(item => item.type === type) }))
})
const openMealTypes = computed(() => groupedToday.value.filter(slot => slot.type !== 'Other' && !slot.meals.length).map(slot => slot.type))
const activeStreak = computed(() => {
  const date = new Date(`${todayKey}T12:00:00`)
  if (!mealsForDate(todayKey).length) date.setDate(date.getDate() - 1)
  let days = 0
  while (mealsForDate(dateKey(date)).length) {
    days++
    date.setDate(date.getDate() - 1)
  }
  return days
})
const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => {
  const day = new Date(today)
  day.setDate(today.getDate() - 6 + index)
  return { date: dateKey(day), label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day), number: day.getDate() }
}))
const dietitianDays = computed(() => {
  const elapsedDays = weekDays.value.filter(day => day.date <= todayKey)
  return dietitianRange.value === 'Today' ? elapsedDays.slice(-1) : elapsedDays.reverse()
})

function formatTime(value: string) {
  const [hours = '0', minutes = '00'] = value.split(':')
  const hour = Number(hours)
  return `${hour % 12 || 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`
}

function mealsForDate(date: string, patientId = 'caio') {
  return meals.value.filter(meal => meal.patientId === patientId && meal.date === date).sort((a, b) => a.time.localeCompare(b.time))
}

function openLogger(meal?: Meal) {
  focusReturn.value = document.activeElement as HTMLElement
  editingId.value = meal?.id ?? null
  formType.value = meal?.type ?? 'Breakfast'
  formTime.value = meal?.time ?? `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
  formFoods.value = meal ? meal.foods.map(food => ({ ...food })) : [{ name: '', quantity: '', unit: 'g' }]
  formNotes.value = meal?.notes ?? ''
  formPhoto.value = meal?.photo ?? ''
  formHunger.value = meal?.hunger ?? null
  formFullness.value = meal?.fullness ?? null
  formError.value = ''
  logStep.value = 1
  logOpen.value = true
}

function onDialogKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    logOpen.value = false
    return
  }
  if (event.key !== 'Tab') return
  const focusable = dialogRef.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
  if (!focusable?.length) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(logOpen, async open => {
  if (open) {
    document.addEventListener('keydown', onDialogKeyDown)
    await nextTick()
    dialogRef.value?.querySelector<HTMLElement>('.food-name-input')?.focus()
  } else {
    document.removeEventListener('keydown', onDialogKeyDown)
    focusReturn.value?.focus()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDialogKeyDown)
  if (xpFeedbackTimeout) clearTimeout(xpFeedbackTimeout)
})

function showXpFeedback(points: number) {
  xpFeedback.value = `A little win · +${points} XP`
  if (xpFeedbackTimeout) clearTimeout(xpFeedbackTimeout)
  xpFeedbackTimeout = setTimeout(() => { xpFeedback.value = '' }, 2800)
}

function saveMeasurement() {
  const value = Number(measurementValue.value)
  if (!Number.isFinite(value) || value <= 0) return
  profile.value.weight = value.toFixed(1)
  showMeasurementInput.value = false
  measurementValue.value = ''
  xp.value += 5
  showXpFeedback(5)
}

function addFood() {
  formFoods.value.push({ name: '', quantity: '', unit: 'g' })
}

function removeFood(index: number) {
  if (formFoods.value.length === 1) {
    formFoods.value[0] = { name: '', quantity: '', unit: 'g' }
  } else {
    formFoods.value.splice(index, 1)
  }
}

function nextStep() {
  if (!formFoods.value.some(food => food.name.trim())) {
    formError.value = 'Add at least one food to keep your story going.'
    return
  }
  formError.value = ''
  logStep.value = 2
}

function saveMeal() {
  if (!formTime.value) {
    formError.value = 'Add an approximate time for this moment.'
    return
  }
  const items = formFoods.value
    .filter(food => food.name.trim())
    .map(food => ({ ...food, name: food.name.trim(), quantity: String(food.quantity).trim() || '1' }))
  if (items.length === 0) {
    logStep.value = 2
    formError.value = 'Add at least one food to keep your story going.'
    return
  }
  const existing = editingId.value ? meals.value.find(meal => meal.id === editingId.value) : undefined
  const meal: Meal = {
    id: editingId.value ?? `meal-${Date.now()}`,
    patientId: 'caio',
    type: formType.value,
    time: formTime.value,
    date: currentDate.value,
    foods: items,
    notes: formNotes.value.trim() || undefined,
    photo: formPhoto.value || undefined,
    hunger: formHunger.value ?? undefined,
    fullness: formFullness.value ?? undefined
  }
  if (existing) {
    Object.assign(existing, meal)
  } else {
    meals.value.push(meal)
    const earnedXp = 10 + (formPhoto.value ? 15 : 0)
    xp.value += earnedXp
    showXpFeedback(earnedXp)
  }
  logOpen.value = false
}

function deleteMeal(meal: Meal) {
  if (confirm(`Remove your ${meal.type.toLowerCase()} entry?`)) {
    meals.value = meals.value.filter(item => item.id !== meal.id)
  }
}

function onPhotoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  formPhoto.value = URL.createObjectURL(file)
}

function setView(view: ViewName) {
  activeView.value = view
  if (view === 'home') currentDate.value = todayKey
}

function toggleRole() {
  role.value = role.value === 'patient' ? 'dietitian' : 'patient'
  activeView.value = role.value === 'dietitian' ? 'dashboard' : 'home'
  selectedPatient.value = patients[0]!
}

function selectPatient(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  selectedPatient.value = patients.find(patient => patient.id === id) ?? patients[0]!
}

async function exportDiary() {
  printAllDetails.value = true
  if (activeView.value === 'reports') {
    activeView.value = 'patient-detail'
    await nextTick()
    window.print()
    printAllDetails.value = false
    return
  }
  window.print()
  printAllDetails.value = false
}

function toggleMealDetail(meal: Meal) {
  expandedMealId.value = expandedMealId.value === meal.id ? null : meal.id
}

function openPatient(patient: typeof patients[number]) {
  selectedPatient.value = patient
  activeView.value = 'patient-detail'
}
</script>

<template>
  <div class="app-shell" :class="{ 'is-dietitian': isDietitian }">
    <aside class="sidebar">
      <a class="brand" href="#" aria-label="Bite home" @click.prevent="setView(isDietitian ? 'patients' : 'home')">
        <span class="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 18.5c0-5.6 4.4-10 10-10s10 4.4 10 10H6Z" /><path d="M8.5 22h15M11 25h10M16 8.5V5" /><path d="M11 12.5 9.5 10M21 12.5l1.5-2" /></svg></span>
        <span class="brand-word">bite<span>.</span></span>
      </a>
      <div class="sidebar-caption">{{ isDietitian ? 'WORKSPACE' : 'YOUR SPACE' }}</div>
      <nav class="side-nav" :aria-label="isDietitian ? 'Dietitian navigation' : 'Patient navigation'">
        <template v-if="!isDietitian">
          <button class="nav-link" :class="{ active: activeView === 'home' }" @click="setView('home')"><span class="nav-icon">⌂</span>Today</button>
          <button class="nav-link" :class="{ active: activeView === 'diary' }" @click="setView('diary')"><span class="nav-icon">▤</span>My diary</button>
          <button class="nav-link" :class="{ active: activeView === 'explore' }" @click="setView('explore')"><span class="nav-icon">✳</span>Food explorer</button>
          <button class="nav-link" :class="{ active: activeView === 'profile' }" @click="setView('profile')"><span class="nav-icon">◉</span>My profile</button>
        </template>
        <template v-else>
          <button class="nav-link" :class="{ active: activeView === 'dashboard' }" @click="setView('dashboard')"><span class="nav-icon">▦</span>Dashboard</button>
          <button class="nav-link" :class="{ active: activeView === 'patients' }" @click="setView('patients')"><span class="nav-icon">♧</span>Patients<span class="nav-count">12</span></button>
          <button class="nav-link" :class="{ active: activeView === 'reports' }" @click="setView('reports')"><span class="nav-icon">▤</span>Reports</button>
          <button class="nav-link" :class="{ active: activeView === 'settings' }" @click="setView('settings')"><span class="nav-icon">⚙</span>Settings</button>
        </template>
      </nav>
      <div class="sidebar-spacer"></div>
      <div v-if="!isDietitian" class="sidebar-xp">
        <div class="xp-heading"><span class="tiny-spark">✦</span><span>YOUR LITTLE WINS</span></div>
        <div class="xp-level"><strong>Level 7</strong><span>Food Explorer</span></div>
        <div class="xp-bar"><span :style="{ width: `${Math.min((xp % 1500) / 1500 * 100, 100)}%` }"></span></div>
        <div class="xp-foot"><span>{{ xp.toLocaleString() }} XP</span><span>1,500 XP</span></div>
      </div>
      <button class="profile-chip" @click="isDietitian ? setView('settings') : setView('profile')">
        <span class="avatar" :class="isDietitian ? 'avatar-purple' : 'avatar-sage'">{{ isDietitian ? 'DR' : 'CE' }}</span>
        <span class="profile-name"><strong>{{ isDietitian ? 'Dr. Ana Costa' : 'Caio Emidio' }}</strong><small>{{ isDietitian ? 'Dietitian' : 'My little corner' }}</small></span>
        <span class="profile-dots">···</span>
      </button>
    </aside>

    <main class="main-panel">
      <header class="topbar">
        <div class="breadcrumb"><span>{{ isDietitian ? 'Workspace' : 'Your food journal' }}</span><span class="breadcrumb-divider">/</span><strong>{{ isDietitian ? activeView === 'dashboard' ? 'Dashboard' : activeView === 'patients' || activeView === 'patient-detail' ? 'Patients' : activeView === 'reports' ? 'Reports' : 'Settings' : activeView === 'home' ? 'Today' : activeView === 'diary' ? 'My diary' : activeView === 'explore' ? 'Food explorer' : 'My profile' }}</strong></div>
        <div class="topbar-actions">
          <span class="sync-status"><i></i>{{ isDietitian ? 'All caught up' : 'A good day to begin' }}</span>
          <button class="role-switch" @click="toggleRole">
            <span class="switch-icon">↗</span><span>Preview {{ isDietitian ? 'patient' : 'dietitian' }} view</span>
          </button>
        </div>
      </header>

      <div class="page-content">
        <template v-if="!isDietitian && activeView === 'home'">
          <section class="welcome-row">
            <div>
              <div class="eyebrow"><span class="eyebrow-dot"></span>{{ prettyDate }}</div>
              <h1>{{ greeting }}, Caio<span class="wave">✳</span></h1>
              <p class="subhead">Your day, your pace. Here’s what’s part of it so far.</p>
            </div>
            <button class="primary-button log-cta" @click="openLogger()"><span class="plus">+</span> Log a meal <span class="button-arrow">↗</span></button>
          </section>

          <div class="home-grid">
            <section class="journey-section">
              <div class="section-heading">
                <div><div class="section-kicker">YOUR {{ weekdayUppercase }}</div><h2>Today’s food journey</h2></div>
                <button class="text-button" @click="setView('diary')">See diary <span>↗</span></button>
              </div>
              <div class="day-overview" aria-live="polite">
                <span class="day-overview-mark">✦</span>
                <p><strong>{{ todayMeals.length }} {{ todayMeals.length === 1 ? 'meal' : 'meals' }} logged</strong><span>{{ todayMeals.length ? `${todayMeals.map(meal => meal.type.toLowerCase()).join(', ')} so far` : 'Start wherever you like' }}</span></p>
                <span class="day-open">{{ openMealTypes.length ? `Still open: ${openMealTypes.join(' · ')}` : 'Your day is all here' }}</span>
              </div>
              <div class="journey-list">
                <article v-for="(slot, index) in groupedToday" :key="slot.type" class="journey-row" :class="{ 'has-meal': slot.meals.length, 'next-up': !slot.meals.length && index === groupedToday.findIndex(item => !item.meals.length) }">
                  <div class="timeline-col">
                    <span class="meal-marker" :class="slot.meals.length ? `marker-${slot.type.toLowerCase()}` : 'marker-empty'">{{ slot.type === 'Breakfast' ? '☼' : slot.type === 'Lunch' ? '◒' : slot.type === 'Snack' ? '✳' : slot.type === 'Dinner' ? '☾' : '·' }}</span>
                    <span v-if="index < groupedToday.length - 1" class="timeline-line"></span>
                  </div>
                  <template v-if="slot.meals.length">
                    <div v-for="meal in slot.meals" :key="meal.id" class="meal-card">
                      <div class="meal-card-top">
                        <div class="meal-title-wrap"><span class="meal-title">{{ slot.type }}</span><span class="meal-time">{{ formatTime(meal.time) }}</span></div>
                        <div class="meal-actions"><button class="icon-button" aria-label="Edit meal" @click="openLogger(meal)">↗</button><button class="icon-button quiet" aria-label="Delete meal" @click="deleteMeal(meal)">×</button></div>
                      </div>
                      <div class="food-chips"><span v-for="food in meal.foods" :key="food.name">{{ food.name }}</span></div>
                      <p v-if="meal.notes" class="meal-note">“{{ meal.notes }}”</p>
                      <img v-if="meal.photo" :src="meal.photo" alt="Meal" class="meal-photo">
                    </div>
                  </template>
                  <div v-else class="meal-card meal-card-empty">
                      <div class="empty-meal-copy">
                        <div><span class="meal-title">{{ slot.type }}</span><span class="meal-time">Whenever it happens</span></div>
                        <span class="not-yet">Not logged yet</span>
                      </div>
                      <button class="add-slot" :aria-label="`Log ${slot.type.toLowerCase()}`" @click="openLogger(); formType = slot.type"><span>+</span></button>
                  </div>
                </article>
              </div>
            </section>

            <aside class="home-aside">
              <section class="streak-card">
                <div class="streak-top"><span class="streak-flower">✳</span><span class="streak-label">A RHYTHM OF YOUR OWN</span></div>
                <div class="streak-number">{{ activeStreak }} <span>{{ activeStreak === 1 ? 'day' : 'days' }}</span></div>
                <p>{{ activeStreak ? 'You showed up for yourself. That counts.' : 'Whenever you’re ready, your next moment is welcome.' }}</p>
                <div class="streak-week">
                  <span v-for="(day, i) in weekDays" :key="day.date" class="streak-day">
                    <i :class="{ checked: mealsForDate(day.date).length > 0, today: day.date === todayKey }">{{ mealsForDate(day.date).length ? '✓' : '' }}</i>
                    <small>{{ day.label.slice(0, 1) }}</small>
                  </span>
                </div>
              </section>
              <section class="aside-card explorer-peek">
                <div class="aside-card-heading"><div><span class="tiny-spark">✦</span> FOOD EXPLORER</div><button aria-label="Explore foods" @click="setView('explore')">↗</button></div>
                <p>Little discoveries, one bite at a time.</p>
                <div class="discovery-stats"><span v-for="group in foodGroups" :key="group.name" class="discovery-dot" :class="`dot-${group.color}`" :title="`${group.count} ${group.name.toLowerCase()} discovered`"></span><strong>32 <small>foods</small></strong></div>
                <button class="aside-link" @click="setView('explore')">See what you’ve found <span>→</span></button>
              </section>
              <section class="aside-quote">
                <span class="quote-mark">“</span><p>There’s no perfect way to eat. Just your way.</p><span class="quote-byline">A little reminder from Bite</span>
              </section>
            </aside>
          </div>
        </template>

        <template v-else-if="!isDietitian && activeView === 'diary'">
          <section class="welcome-row page-title-row">
            <div><div class="eyebrow"><span class="eyebrow-dot"></span>A look back, no judgment</div><h1>Your diary<span class="wave">✳</span></h1><p class="subhead">Every meal is part of your story.</p></div>
            <button class="primary-button" @click="openLogger()"><span class="plus">+</span> Log a meal</button>
          </section>
          <section class="diary-week card-surface">
            <div class="section-heading compact-heading"><div><div class="section-kicker">YOUR WEEK</div><h2>A few days in good company</h2></div><button class="outline-button" @click="currentDate = todayKey">Today · {{ shortDate }}</button></div>
            <div class="week-strip">
              <button v-for="day in weekDays" :key="day.date" class="week-day" :class="{ selected: currentDate === day.date, 'week-today': day.date === todayKey }" @click="currentDate = day.date"><span>{{ day.label }}</span><strong>{{ day.number }}</strong><i v-if="mealsForDate(day.date).length"></i></button>
            </div>
          </section>
          <section class="diary-day">
            <div class="diary-day-heading"><h2>{{ currentDate === todayKey ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${currentDate}T12:00:00`)) }}</h2><span>{{ mealsForDate(currentDate).length }} {{ mealsForDate(currentDate).length === 1 ? 'moment' : 'moments' }} saved</span></div>
            <div v-if="mealsForDate(currentDate).length" class="diary-meal-grid">
              <article v-for="meal in mealsForDate(currentDate)" :key="meal.id" class="diary-card card-surface">
                <img v-if="meal.photo" :src="meal.photo" alt="Meal" class="diary-image">
                <div class="diary-card-header"><span class="meal-type-pill">{{ meal.type }}</span><span class="meal-time">{{ formatTime(meal.time) }}</span><button class="icon-button" aria-label="Edit meal" @click="openLogger(meal)">↗</button></div>
                <div class="diary-food-list"><div v-for="food in meal.foods" :key="food.name"><span>{{ food.name }}</span><span>{{ food.quantity }} {{ food.unit }}</span></div></div>
                <p v-if="meal.notes" class="meal-note">“{{ meal.notes }}”</p>
              </article>
            </div>
            <div v-else class="empty-state card-surface"><span class="empty-illustration">☼</span><h3>No meals this day</h3><p>Your food story has room for whatever comes next.</p><button class="text-button" @click="openLogger()">Add a little moment <span>↗</span></button></div>
          </section>
        </template>

        <template v-else-if="!isDietitian && activeView === 'explore'">
          <section class="welcome-row page-title-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span>Curiosity looks good on you</div><h1>Food explorer<span class="wave">✳</span></h1><p class="subhead">A little collection of things you’ve enjoyed along the way.</p></div></section>
          <section class="explorer-hero card-surface"><div class="explorer-hero-art"><span>✳</span><i>✳</i><b>·</b></div><div class="explorer-hero-copy"><span class="section-kicker">YOUR PERSONAL COLLECTION</span><h2>32 foods, and counting.</h2><p>Every food you log adds a little color to your collection. No scores. No targets. Just things that make up your days.</p></div><div class="explorer-total"><strong>32</strong><span>little discoveries</span></div></section>
          <section class="explore-grid">
            <article v-for="(group, index) in foodGroups" :key="group.name" class="food-group-card card-surface" :class="`group-${group.color}`">
              <div class="group-top"><span class="group-symbol">{{ group.symbol }}</span><span class="group-index">0{{ index + 1 }}</span></div>
              <div class="group-count">{{ group.count }} <span>discovered</span></div><h3>{{ group.name }}</h3><p>{{ group.examples }}</p><div class="group-sprinkles"><i v-for="n in group.count > 9 ? 5 : 4" :key="n"></i></div>
            </article>
          </section>
          <section class="recent-foods card-surface"><div class="section-heading compact-heading"><div><div class="section-kicker">RECENTLY MET</div><h2>New around here</h2></div><span class="soft-badge">Just for fun</span></div><div class="food-discovery-list"><span>Blueberries</span><span>Greek yogurt</span><span>Roasted broccoli</span><span>Oat milk</span><span>Brown rice</span><span>Avocado</span></div></section>
        </template>

        <template v-else-if="!isDietitian && activeView === 'profile'">
          <section class="welcome-row page-title-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span>A few things about you</div><h1>Your profile<span class="wave">✳</span></h1><p class="subhead">The little details you’ve shared with your dietitian.</p></div><button class="outline-button" @click="exportDiary()">Print profile ↗</button></section>
          <div class="profile-grid">
            <section class="profile-card card-surface"><div class="profile-card-title"><span class="avatar avatar-sage large-avatar">{{ profile.name.split(' ').map(part => part[0]).join('') }}</span><div><h2>{{ profile.name }}</h2><p>Here for your own reasons, always.</p></div><button class="icon-button" :aria-label="profileEditing ? 'Save profile' : 'Edit profile'" @click="profileEditing = !profileEditing">{{ profileEditing ? '✓' : '↗' }}</button></div>
              <div v-if="profileEditing" class="profile-fields profile-edit-fields"><label>Name<input v-model="profile.name" class="text-input"></label><label>Date of birth<input v-model="profile.dateOfBirth" class="text-input" type="date"></label><label>Height (cm)<input v-model="profile.height" class="text-input" type="number" min="1"></label><label>A little about my visit<input v-model="profile.reason" class="text-input"></label><button class="primary-button" @click="profileEditing = false">Save details</button></div>
              <div v-else class="profile-fields"><div><small>DATE OF BIRTH</small><strong>{{ new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${profile.dateOfBirth}T12:00:00`)) }} <span>· {{ Math.floor((today.getTime() - new Date(`${profile.dateOfBirth}T12:00:00`).getTime()) / 31_557_600_000) }} years</span></strong></div><div><small>HEIGHT</small><strong>{{ profile.height }} cm</strong></div><div><small>A LITTLE ABOUT MY VISIT</small><strong>{{ profile.reason }}</strong></div></div><div class="profile-footnote">Shared with your dietitian, and kept just for you.</div></section>
            <section class="weight-card card-surface"><div class="section-heading compact-heading"><div><div class="section-kicker">BODY, OVER TIME</div><h2>Weight history</h2></div><button class="icon-button" aria-label="Add measurement" @click="showMeasurementInput = !showMeasurementInput">+</button></div><p class="weight-caption">Measurements are just information, never a grade.</p><div v-if="showMeasurementInput" class="measurement-entry"><label for="weight-value">A new measurement (kg)</label><div><input id="weight-value" v-model="measurementValue" class="text-input" type="number" min="1" step="0.1" placeholder="89.0"><button class="primary-button" @click="saveMeasurement()">Save</button></div></div><div class="weight-chart"><div class="chart-y-axis"><span>91 kg</span><span>90 kg</span><span>89 kg</span><span>88 kg</span></div><div class="chart-plot"><i class="chart-line"></i><span class="chart-point point-one"><b>90.4</b></span><span class="chart-point point-two"><b>89.8</b></span><span class="chart-point point-three"><b>{{ profile.weight }}</b></span><div class="chart-dates"><span>Sep 02</span><span>Sep 16</span><span>{{ shortDate }}</span></div></div></div><div class="weight-current"><span>Most recent</span><strong>{{ profile.weight }} <small>kg</small></strong></div></section>
          </div>
        </template>

        <template v-else-if="isDietitian && activeView === 'dashboard'">
          <section class="welcome-row clinician-welcome">
            <div><div class="eyebrow"><span class="eyebrow-dot"></span>Wednesday · September 30</div><h1>Good afternoon, Ana<span class="wave">✳</span></h1><p class="subhead">Here’s a gentle pulse on your people.</p></div>
            <button class="outline-button">＋ Invite a patient</button>
          </section>
          <div class="clinician-stats"><section class="stat-card card-surface"><span>ACTIVE PATIENTS</span><strong>12</strong><small><i></i> 3 new this month</small></section><section class="stat-card card-surface"><span>CHECKED IN TODAY</span><strong>8 <em>/ 12</em></strong><small>A little moment from 8 people</small></section><section class="stat-card card-surface"><span>RECENT DIARIES</span><strong>24</strong><small>Shared in the last 7 days</small></section></div>
          <div class="dashboard-grid"><section class="patient-list-panel card-surface"><div class="section-heading compact-heading"><div><div class="section-kicker">YOUR PEOPLE</div><h2>Recent activity</h2></div><button class="text-button" @click="setView('patients')">All patients <span>↗</span></button></div><button v-for="patient in patients" :key="patient.id" class="patient-row" @click="openPatient(patient)"><span class="avatar" :class="`avatar-${patient.color}`">{{ patient.initials }}</span><span class="patient-row-info"><strong>{{ patient.name }}</strong><small>{{ patient.focus }}</small></span><span class="patient-last"><strong>{{ patient.last.split(' · ')[0] }}</strong><small>{{ patient.last.split(' · ')[1] ?? '8:32' }}</small></span><span class="patient-arrow">↗</span></button></section>
            <aside class="dietitian-note-card"><span class="note-overline">A NOTE FOR YOU</span><span class="note-quote">“</span><p>Curiosity beats certainty. Keep asking what feels right for them.</p><small>Your practice, your pace.</small><span class="note-flower">✳</span></aside></div>
        </template>

        <template v-else-if="isDietitian && activeView === 'patients'">
          <section class="welcome-row page-title-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span>People in your corner</div><h1>Your patients<span class="wave">✳</span></h1><p class="subhead">A little closer to the stories they’re sharing.</p></div><button class="outline-button">＋ Invite a patient</button></section>
          <section class="patient-list-panel card-surface directory-panel"><div class="section-heading compact-heading"><div><div class="section-kicker">YOUR PEOPLE</div><h2>12 active patients</h2></div><input class="text-input patient-search" type="search" placeholder="Find someone…"></div><button v-for="patient in patients" :key="patient.id" class="patient-row" @click="openPatient(patient)"><span class="avatar" :class="`avatar-${patient.color}`">{{ patient.initials }}</span><span class="patient-row-info"><strong>{{ patient.name }}</strong><small>{{ patient.focus }}</small></span><span class="patient-last"><strong>{{ patient.last.split(' · ')[0] }}</strong><small>{{ patient.last.split(' · ')[1] ?? '8:32' }}</small></span><span class="patient-arrow">↗</span></button></section>
        </template>

        <template v-else-if="isDietitian && activeView === 'patient-detail'">
          <section class="patient-detail-top"><button class="back-link" @click="setView('patients')">← All patients</button><div class="patient-detail-title"><span class="avatar avatar-sage large-avatar">{{ selectedPatient.initials }}</span><div><div class="eyebrow"><span class="eyebrow-dot"></span>Patient diary</div><h1>{{ selectedPatient.name }}<span class="wave">✳</span></h1><p class="subhead">{{ selectedPatient.email }} · {{ selectedPatient.focus }}</p></div><button class="primary-button export-button" @click="exportDiary()">Export diary <span>↗</span></button></div></section>
          <section class="patient-info-strip card-surface"><div><small>AGE</small><strong>{{ selectedPatient.age }} years</strong></div><div><small>HEIGHT</small><strong>{{ selectedPatient.height }}</strong></div><div><small>CURRENT BODY MASS</small><strong>{{ selectedPatient.weight }}</strong></div><div><small>HERE FOR</small><strong>{{ selectedPatient.reason }}</strong></div></section>
          <section class="patient-diary card-surface"><div class="section-heading compact-heading"><div><div class="section-kicker">FOOD DIARY</div><h2>{{ dietitianRange === 'Today' ? `Today with ${selectedPatient.name.split(' ')[0]}` : `A week in ${selectedPatient.name.split(' ')[0]}’s world` }}</h2></div><div class="range-control"><button v-for="range in ['Today', 'Week', 'Calendar'] as const" :key="range" :class="{ selected: dietitianRange === range }" @click="dietitianRange = range">{{ range }}</button></div></div>
            <div v-for="day in dietitianDays" :key="day.date" class="clinician-day">
              <div class="patient-diary-date"><span>{{ day.label.toUpperCase() }} <strong>{{ day.number }}</strong></span><div><i></i> {{ mealsForDate(day.date, selectedPatient.id).length }} {{ mealsForDate(day.date, selectedPatient.id).length === 1 ? 'moment' : 'moments' }} shared</div></div>
              <template v-if="mealsForDate(day.date, selectedPatient.id).length">
                <div v-for="meal in mealsForDate(day.date, selectedPatient.id)" :key="meal.id" class="clinician-meal"><span class="clinician-meal-time">{{ formatTime(meal.time) }}</span><span class="clinician-meal-dot"></span><div class="clinician-meal-content"><strong>{{ meal.type }}</strong><button class="text-button meal-detail-toggle" @click="toggleMealDetail(meal)">{{ expandedMealId === meal.id ? 'Hide' : 'Details' }} <span>↗</span></button><div class="clinician-foods">{{ meal.foods.map(food => food.name).join(' · ') }}</div><p v-if="meal.notes">“{{ meal.notes }}”</p><div v-if="expandedMealId === meal.id || printAllDetails" class="clinician-meal-extra"><img v-if="meal.photo" :src="meal.photo" :alt="`${meal.type} photo`"><div v-for="food in meal.foods" :key="food.name" class="clinician-food-detail"><span>{{ food.name }}</span><small>{{ food.quantity }} {{ food.unit }}</small></div><p v-if="meal.notes"><strong>A note</strong> “{{ meal.notes }}”</p><div v-if="meal.hunger !== undefined" class="feeling-summary">Hunger before <strong>{{ meal.hunger }} / 5</strong></div><div v-if="meal.fullness !== undefined" class="feeling-summary">Fullness after <strong>{{ meal.fullness }} / 5</strong></div></div></div></div>
              </template>
              <p v-else class="no-diary-moments">A quiet day in the diary. No moments shared yet.</p>
            </div>
            <div class="patient-history-note"><span>↗</span> Body mass has been steady across the last three check-ins.</div>
          </section>
        </template>

        <template v-else-if="isDietitian && activeView === 'reports'">
          <section class="welcome-row page-title-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span>A clearer view, when you need it</div><h1>Reports<span class="wave">✳</span></h1><p class="subhead">A thoughtful summary of the stories your patients have shared.</p></div></section>
          <section class="report-panel card-surface"><div><div class="section-kicker">READY WHEN YOU ARE</div><h2>Take the diary with you.</h2><p>Choose a patient to prepare a clean, printable report with their meals, notes, and the details they’ve shared.</p></div><div class="report-form"><label for="report-patient">Patient</label><select id="report-patient" :value="selectedPatient.id" @change="selectPatient"><option v-for="patient in patients" :key="patient.id" :value="patient.id">{{ patient.name }}</option></select><label for="report-range">Date range</label><select id="report-range"><option>This week · Sep 24–30</option><option>This month</option><option>All entries</option></select><button class="primary-button" @click="exportDiary()">Prepare printable report <span>↗</span></button></div></section>
        </template>

        <template v-else-if="isDietitian && activeView === 'settings'">
          <section class="welcome-row page-title-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span>Your practice, your way</div><h1>Settings<span class="wave">✳</span></h1><p class="subhead">A few things that make this space yours.</p></div></section>
          <section class="settings-panel card-surface"><div class="settings-avatar"><span class="avatar avatar-purple large-avatar">DR</span><div><h2>Dr. Ana Costa</h2><p>Nutritionist · Your practice</p></div><button class="outline-button">Edit details ↗</button></div><div class="settings-row"><div><strong>Patient invitations</strong><small>New patients can request to connect with your practice.</small></div><span class="toggle-on"><i></i></span></div><div class="settings-row"><div><strong>Weekly diary summary</strong><small>A gentle reminder when a patient shares a week of meals.</small></div><span class="toggle-on"><i></i></span></div></section>
        </template>
      </div>

      <nav class="mobile-nav" :aria-label="isDietitian ? 'Dietitian navigation' : 'Patient navigation'">
        <template v-if="!isDietitian"><button :class="{ active: activeView === 'home' }" @click="setView('home')"><span>⌂</span>Today</button><button :class="{ active: activeView === 'diary' }" @click="setView('diary')"><span>▤</span>Diary</button><button :class="{ active: activeView === 'explore' }" @click="setView('explore')"><span>✳</span>Explore</button><button :class="{ active: activeView === 'profile' }" @click="setView('profile')"><span>◉</span>Profile</button></template>
        <template v-else><button :class="{ active: activeView === 'dashboard' }" @click="setView('dashboard')"><span>▦</span>Dashboard</button><button :class="{ active: activeView === 'patients' || activeView === 'patient-detail' }" @click="setView('patients')"><span>♧</span>Patients</button><button :class="{ active: activeView === 'reports' }" @click="setView('reports')"><span>▤</span>Reports</button><button :class="{ active: activeView === 'settings' }" @click="setView('settings')"><span>⚙</span>Settings</button></template>
      </nav>
      <button v-if="!isDietitian && activeView !== 'home'" class="mobile-log-button" @click="openLogger()"><span>+</span></button>
    </main>

    <Transition name="sheet">
      <div v-if="logOpen" class="modal-backdrop" @click.self="logOpen = false" @keydown.esc="logOpen = false">
        <section ref="dialogRef" class="log-sheet" role="dialog" aria-modal="true" aria-labelledby="log-title">
          <div class="sheet-handle"></div><div class="sheet-header"><div><div class="section-kicker">A LITTLE MOMENT FOR YOU</div><h2 id="log-title">{{ editingId ? 'A meal, remembered.' : logStep === 1 ? 'What did you enjoy?' : 'Anything else to remember?' }}</h2></div><button class="close-button" aria-label="Close meal form" @click="logOpen = false">×</button></div>
          <div class="step-indicator"><span v-for="step in 2" :key="step" :class="{ filled: step <= logStep }"></span><small>{{ logStep }} of 2 · details are optional</small></div>
          <div class="sheet-body">
            <template v-if="logStep === 1">
              <div class="composer-meta"><label class="field-label">This was</label><div class="meal-type-options"><button v-for="type in ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'] as const" :key="type" class="type-option" :class="{ chosen: formType === type }" @click="formType = type"><span>{{ type === 'Breakfast' ? '☼' : type === 'Lunch' ? '◒' : type === 'Dinner' ? '☾' : type === 'Snack' ? '✳' : '·' }}</span>{{ type }}</button></div><label class="field-label time-label" for="meal-time">Around what time?</label><input id="meal-time" v-model="formTime" class="text-input time-input" type="time"></div>
              <label class="field-label food-prompt">Tell me about it</label>
              <p class="field-hint">A word or two is plenty. Add as much or as little as you like.</p>
              <div v-for="(food, index) in formFoods" :key="index" class="food-entry"><input v-model="food.name" :aria-label="`Food ${index + 1}`" class="text-input food-name-input" :placeholder="index === 0 ? 'What did you eat or drink?' : 'And anything else?'" @keydown.enter.prevent="index === formFoods.length - 1 ? addFood() : undefined"><button class="remove-food" :aria-label="`Remove food ${index + 1}`" @click="removeFood(index)">×</button><details class="food-amount"><summary>{{ food.quantity ? `${food.quantity} ${food.unit}` : 'Add an amount (optional)' }}</summary><div><input v-model="food.quantity" :aria-label="`Quantity for food ${index + 1}`" class="text-input quantity-input" type="number" min="0" step="any" placeholder="1"><select v-model="food.unit" :aria-label="`Unit for food ${index + 1}`" class="text-input unit-select"><option v-for="unit in ['g', 'kg', 'ml', 'L', 'slice', 'piece', 'tbsp', 'tsp', 'cup', 'glass', 'serving', 'bowl', 'handful', 'other']" :key="unit">{{ unit }}</option></select></div></details></div><button class="add-food-button" @click="addFood"><span>+</span> Add another food</button>
            </template>
            <template v-else>
              <p class="field-hint">Only if you feel like it. These little details are completely optional.</p>
              <div class="photo-picker" :class="{ 'has-photo': formPhoto }"><template v-if="formPhoto"><img :src="formPhoto" alt="Selected meal"><button class="photo-remove" @click="formPhoto = ''">Remove photo ×</button></template><template v-else><span class="photo-sun">☼</span><div><strong>Want to remember this one?</strong><small>A photo can bring a moment back.</small></div><button class="outline-button small-button" @click="photoInput?.click()">Choose a photo</button></template><input ref="photoInput" class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" @change="onPhotoChange"></div>
              <label class="field-label" for="meal-note">A note to future you</label><textarea id="meal-note" v-model="formNotes" class="text-input notes-input" placeholder="A small detail you’d like to remember…"></textarea>
              <div class="feeling-fields"><div><label class="field-label" for="hunger-range">Hunger before <button class="skip-feeling" @click="formHunger = null">Skip</button></label><div class="range-value">{{ formHunger ?? '—' }} <small>of 5</small></div><input id="hunger-range" :value="formHunger ?? 3" type="range" min="1" max="5" class="feeling-range" @input="formHunger = Number(($event.target as HTMLInputElement).value)"></div><div><label class="field-label" for="fullness-range">Fullness after <button class="skip-feeling" @click="formFullness = null">Skip</button></label><div class="range-value">{{ formFullness ?? '—' }} <small>of 5</small></div><input id="fullness-range" :value="formFullness ?? 3" type="range" min="1" max="5" class="feeling-range" @input="formFullness = Number(($event.target as HTMLInputElement).value)"></div></div>
            </template>
            <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          </div>
          <div class="sheet-footer"><button v-if="logStep > 1" class="back-button" @click="logStep = 1">← Back</button><button v-else class="back-button" @click="logOpen = false">Maybe later</button><button v-if="logStep === 1" class="details-button" @click="nextStep">Add a little detail <span>→</span></button><button class="primary-button sheet-next" @click="saveMeal">{{ editingId ? 'Save changes' : 'Save this moment' }} <span>✦</span></button></div>
        </section>
      </div>
    </Transition>
    <Transition name="toast"><div v-if="xpFeedback" class="xp-toast" role="status" aria-live="polite"><span>✦</span>{{ xpFeedback }}</div></Transition>
  </div>
</template>

<style>
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>

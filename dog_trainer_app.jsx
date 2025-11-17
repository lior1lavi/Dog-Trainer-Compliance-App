import React, { useState, useReducer, useContext, createContext, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  User, 
  Dog, 
  Clipboard, 
  X, 
  ChevronRight, 
  Book, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  LogOut, 
  Loader2,
  // --- NEW ICONS ---
  Calendar,
  CreditCard,
  Target,
  FileText,
  Edit,
  Share2,
  Clock,
  MapPin,
  HelpCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';

// --- 1. STATE MANAGEMENT (In-Memory Database) ---

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

// --- Mock Data for a good demo ---
const MOCK_CLIENT_ID = 'client-1';
const MOCK_PET_ID = 'pet-1';
const MOCK_TEMPLATE_ID = 'template-1';
const MOCK_HOMEWORK_ID = 'homework-1';
const MOCK_TASK_ID_1 = 'task-1';
const MOCK_TASK_ID_2 = 'task-2';
const MOCK_TASK_ID_3 = 'task-3';

// --- NEW: Stock Templates ---
const STOCK_TEMPLATES = [
  { id: 'stock-1', title: 'Puppy Basics: Week 1', tasks: ['Practice "Sit" (5 mins, 2x daily)', 'Crate games (10 mins)', 'Handling & grooming (5 mins)'] },
  { id: 'stock-2', title: 'Leash Manners: Stop Pulling', tasks: ['"Loose Leash" walking practice (15 mins)', '"Look at me" game (5 mins)', 'Practice "Wait" at doorways'] },
  { id: 'stock-3', title: 'Recall: Come When Called', tasks: ['"Here" game with high-value treats (10 mins)', 'Long-line recall practice (20 ft line)', 'Hide-and-seek recall in the house'] },
  { id: 'stock-4', title: 'Separation Anxiety: Basics', tasks: ['"Place" training (15 mins)', '"calm" departures (2-5 mins)', 'Frozen Kong/LickiMat session'] }
];

// --- WALKTHROUGH GUIDES (In-App Tips) ---
const WALKTHROUGH_GUIDES = {
  dashboard: {
    title: 'Dashboard Overview',
    tips: [
      { id: 'nav-dashboard', title: '📊 Dashboard', description: 'View all your active homework assignments and track client progress in one place.' },
      { id: 'homework-cards', title: 'Active Assignments', description: 'Each card shows a client, their pet, and a progress bar for task completion.' },
      { id: 'copy-button', title: '🔗 Copy Link', description: 'Share the portal link with clients so they can view and update their progress.' },
      { id: 'view-portal', title: '👁️ View Portal', description: 'Click to see detailed task breakdown and client progress details.' }
    ]
  },
  clients: {
    title: 'Managing Clients',
    tips: [
      { id: 'add-client-btn', title: '➕ Add Client', description: 'Click the Add Client button to create a new client profile with their contact information.' },
      { id: 'add-client-form', title: '📝 Fill in Details', description: 'Enter the client\'s name, email address, and phone number. Then click Add Client.' },
      { id: 'client-card', title: 'Client Card', description: 'Click on any client card to view their full profile, pets, goals, and assignments.' },
      { id: 'edit-client-details', title: '✏️ Edit Client', description: 'Access the detailed client profile to manage their information, pets, and goals.' }
    ]
  },
  clientDetail: {
    title: 'Managing Client Details',
    tips: [
      { id: 'homework-tab', title: '📋 Homework Tab', description: 'View and assign homework plans for this client.' },
      { id: 'template-select', title: 'Select Template', description: 'Choose from pre-built homework templates or start from scratch.' },
      { id: 'assign-btn', title: '🎯 Assign Homework', description: 'Click to create and assign the homework plan to this client.' },
      { id: 'edit-client-details', title: '✏️ Client Details', description: 'View and edit the client\'s profile, pets, and goals.' }
    ]
  },
  scheduling: {
    title: 'Scheduling Sessions',
    tips: [
      { id: 'calendar', title: '📅 Calendar', description: 'Click on any date in the calendar to create or view training sessions.' },
      { id: 'session-form', title: '📝 New Session', description: 'Click the New Session button to create a training session.' },
      { id: 'share-session', title: '📤 Upcoming Sessions', description: 'View your upcoming training sessions and share details with clients.' },
      { id: 'calendar', title: '✅ Session Details', description: 'Click on any session to view or edit the details.' }
    ]
  },
  homework: {
    title: 'Creating Homework',
    tips: [
      { id: 'template-select', title: '🎨 Template', description: 'Use pre-built templates for quick creation or start from scratch.' },
      { id: 'task-list', title: 'Add Tasks', description: 'Select predefined tasks or create custom ones for the client.' },
      { id: 'template-select', title: 'Save Template', description: 'Save your template for reuse with other clients.' },
      { id: 'task-list', title: 'Templates Library', description: 'View all your saved templates.' }
    ]
  }
};

const initialState = {
  trainerEmail: null, // 'user@example.com' when logged in
  walkthroughEnabled: false, // Toggle for in-app guidance tips
  currentWalkthroughStep: null, // Track current walkthrough step
  clients: {
    [MOCK_CLIENT_ID]: { 
      id: MOCK_CLIENT_ID, 
      name: 'John Smith', 
      email: 'john@example.com', 
      phone: '555-1234',
      // --- NEW V2 FIELDS ---
      notes: 'John is very consistent and great with Buddy. Needs to work on timing the reward marker.',
      goals: [
        { id: 'goal-1', text: 'Pass Canine Good Citizen (CGC) test', isComplete: false },
        { id: 'goal-2', text: 'Walk calmly past other dogs', isComplete: true },
      ]
    }
  },
  pets: {
    [MOCK_PET_ID]: { 
      id: MOCK_PET_ID, 
      clientId: MOCK_CLIENT_ID, 
      name: 'Buddy', 
      breed: 'Golden Retriever', 
      age: 2,
      // --- NEW V2 FIELDS ---
      skillLevel: 'Intermediate',
      concerns: 'Pulls on leash, jumps on guests'
    }
  },
  templates: {
    [MOCK_TEMPLATE_ID]: { id: MOCK_TEMPLATE_ID, title: 'Week 1: Puppy Basics', tasks: ['Practice "Sit" 5 mins', 'Practice "Place" 10 mins', 'Crate games 2x daily'] }
  },
  homeworks: {
    [MOCK_HOMEWORK_ID]: { 
      id: MOCK_HOMEWORK_ID, 
      clientId: MOCK_CLIENT_ID, 
      title: "Buddy's Week 1 Plan", 
      portalId: 'a83bN-c73K' // Fake unique ID
    }
  },
  tasks: {
    [MOCK_TASK_ID_1]: { id: MOCK_TASK_ID_1, homeworkId: MOCK_HOMEWORK_ID, description: 'Practice "Sit" 5 mins', isComplete: true },
    [MOCK_TASK_ID_2]: { id: MOCK_TASK_ID_2, homeworkId: MOCK_HOMEWORK_ID, description: 'Practice "Place" 10 mins', isComplete: false },
    [MOCK_TASK_ID_3]: { id: MOCK_TASK_ID_3, homeworkId: MOCK_HOMEWORK_ID, description: 'Crate games 2x daily', isComplete: false },
  },
  sessions: {
    // id: { id, clientId, petId, dateTime, duration, location, title, notes, assignedTasks, isShared, shareId }
  },
};

// Our "backend" logic
function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, trainerEmail: action.payload.email };
    case 'LOGOUT':
      return { ...state, trainerEmail: null };
    
    case 'TOGGLE_WALKTHROUGH':
      return { ...state, walkthroughEnabled: !state.walkthroughEnabled, currentWalkthroughStep: !state.walkthroughEnabled ? 'dashboard' : null };
    
    case 'SET_WALKTHROUGH_STEP':
      return { ...state, currentWalkthroughStep: action.payload };
      
    case 'ADD_CLIENT': {
      const newId = crypto.randomUUID();
      const newClient = { id: newId, ...action.payload };
      return {
        ...state,
        clients: { ...state.clients, [newId]: newClient }
      };
    }
    
    case 'ADD_PET': {
      const newId = crypto.randomUUID();
      const newPet = { id: newId, ...action.payload };
      return {
        ...state,
        pets: { ...state.pets, [newId]: newPet }
      };
    }
    
    case 'ADD_TEMPLATE': {
      const newId = crypto.randomUUID();
      const newTemplate = { id: newId, ...action.payload };
      return {
        ...state,
        templates: { ...state.templates, [newId]: newTemplate }
      };
    }
    
    case 'ASSIGN_HOMEWORK': {
      const { clientId, title, tasks } = action.payload;
      const newHomeworkId = crypto.randomUUID();
      const newHomework = {
        id: newHomeworkId,
        clientId: clientId,
        title: title,
        portalId: crypto.randomUUID().slice(0, 8)
      };
      
      const newTasks = tasks.map(desc => ({
        id: crypto.randomUUID(),
        homeworkId: newHomeworkId,
        description: desc,
        isComplete: false
      }));
      
      const newTasksMap = Object.fromEntries(newTasks.map(t => [t.id, t]));
      
      return {
        ...state,
        homeworks: { ...state.homeworks, [newHomeworkId]: newHomework },
        tasks: { ...state.tasks, ...newTasksMap }
      };
    }
    
    case 'TOGGLE_TASK': {
      const { taskId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return state;
      
      const updatedTask = { ...task, isComplete: !task.isComplete };
      
      return {
        ...state,
        tasks: { ...state.tasks, [taskId]: updatedTask }
      };
    }
    
    // --- NEW V2 ACTIONS ---
    case 'UPDATE_CLIENT_NOTES': {
      const { clientId, notes } = action.payload;
      const client = state.clients[clientId];
      if (!client) return state;
      
      const updatedClient = { ...client, notes };
      return {
        ...state,
        clients: { ...state.clients, [clientId]: updatedClient }
      };
    }
    
    case 'TOGGLE_CLIENT_GOAL': {
      const { clientId, goalId } = action.payload;
      const client = state.clients[clientId];
      if (!client) return state;

      const updatedGoals = client.goals.map(goal => 
        goal.id === goalId ? { ...goal, isComplete: !goal.isComplete } : goal
      );
      
      const updatedClient = { ...client, goals: updatedGoals };
      return {
        ...state,
        clients: { ...state.clients, [clientId]: updatedClient }
      };
    }
    
    case 'ADD_CLIENT_GOAL': {
      const { clientId, goalText } = action.payload;
      const client = state.clients[clientId];
      if (!client || !goalText) return state;

      const newGoal = {
        id: crypto.randomUUID(),
        text: goalText,
        isComplete: false
      };
      
      const updatedClient = { ...client, goals: [...client.goals, newGoal] };
      return {
        ...state,
        clients: { ...state.clients, [clientId]: updatedClient }
      };
    }
    // --- END V2 ACTIONS ---
    
    // --- NEW: SESSION/BOOKING ACTIONS ---
    case 'ADD_SESSION': {
      const newId = crypto.randomUUID();
      const shareId = Math.random().toString(36).substring(2, 15);
      const newSession = { id: newId, shareId, ...action.payload, isShared: false };
      return {
        ...state,
        sessions: { ...state.sessions, [newId]: newSession }
      };
    }
    
    case 'UPDATE_SESSION': {
      const { sessionId, ...updates } = action.payload;
      const session = state.sessions[sessionId];
      if (!session) return state;
      return {
        ...state,
        sessions: { ...state.sessions, [sessionId]: { ...session, ...updates } }
      };
    }
    
    case 'DELETE_SESSION': {
      const { sessionId } = action.payload;
      const { [sessionId]: _, ...remaining } = state.sessions;
      return {
        ...state,
        sessions: remaining
      };
    }
    
    case 'SHARE_SESSION': {
      const { sessionId } = action.payload;
      const session = state.sessions[sessionId];
      if (!session) return state;
      return {
        ...state,
        sessions: { ...state.sessions, [sessionId]: { ...session, isShared: true } }
      };
    }
    // --- END SESSION ACTIONS ---
      
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// Custom hooks to access state and dispatch
function useAppState() {
  return useContext(AppStateContext);
}

function useAppDispatch() {
  return useContext(AppDispatchContext);
}

// --- 2. MAIN APP COMPONENT ---

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // This is our single-page router
  const [view, setView] = useState({ page: 'help' }); // { page: 'help' | 'dashboard' | 'clients' | 'clientDetail' | 'templates' | 'clientPortal' | 'scheduling' | 'billing', id?: string }
  
  // Create a "global" navigation context
  const navigation = {
    view,
    setView,
    goBack: () => window.history.back(), // Simple back, good enough
    toDashboard: () => setView({ page: 'dashboard' }),
    toClients: () => setView({ page: 'clients' }),
    toClientDetail: (id) => setView({ page: 'clientDetail', id }),
    toTemplates: () => setView({ page: 'templates' }),
    toClientPortal: (id) => setView({ page: 'clientPortal', id }),
    // --- NEW V2 NAVIGATION ---
    toScheduling: () => setView({ page: 'scheduling' }),
    toHelp: () => setView({ page: 'help' }),
    toBilling: () => setView({ page: 'billing' }),
  };

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        <NavigationContext.Provider value={navigation}>
          <div className="antialiased bg-gray-100 min-h-screen">
            <AuthManager />
          </div>
        </NavigationContext.Provider>
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// --- 3. AUTHENTICATION ---

const NavigationContext = createContext(null);
const useNavigation = () => useContext(NavigationContext);

function AuthManager() {
  const { trainerEmail } = useAppState();
  
  if (!trainerEmail) {
    return <LoginPage />;
  }
  
  // If logged in, show the main app layout
  return <Layout />;
}

function LoginPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | checking
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (status !== 'idle') return;
    
    setStatus('loading');
    // Simulate sending the magic link
    setTimeout(() => {
      setStatus('checking');
      // Simulate the user clicking the link
      setTimeout(() => {
        dispatch({ type: 'LOGIN', payload: { email } });
      }, 1500);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Trainer Login
        </h1>
        {status === 'idle' && (
          <>
            <p className="text-center text-gray-600 mb-6">
              Enter your email to receive a secure magic link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Send Magic Link
              </Button>
            </form>
          </>
        )}
        {status === 'loading' && (
          <div className="text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Sending link...</p>
          </div>
        )}
        {status === 'checking' && (
          <div className="text-center p-6">
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We've sent a magic link to <strong>{email}</strong>.
            </p>
            <p className="mt-4 text-gray-500 text-sm">
              (Simulating login...)
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// --- 4. WALKTHROUGH COMPONENTS ---

function HighlightElement({ elementId }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const selector = `[data-walkthrough="${elementId}"]`;
    let element = document.querySelector(selector);
    let retries = 0;
    const maxRetries = 10;
    
    // If element doesn't exist yet, retry a few times
    const findAndHighlight = () => {
      element = document.querySelector(selector);
      
      if (element) {
        const elementRect = element.getBoundingClientRect();
        setRect({
          top: elementRect.top + window.scrollY - 8,
          left: elementRect.left + window.scrollX - 8,
          width: elementRect.width + 16,
          height: elementRect.height + 16
        });
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(findAndHighlight, 100); // Retry after 100ms
      }
    };
    
    findAndHighlight();
    
    // Also update position on scroll/resize
    const handleScroll = () => findAndHighlight();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [elementId]);

  if (!rect) return null;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3), 0 0 20px #fbbf24',
        animation: 'pulse 2s infinite',
        zIndex: 40
      }}
    />
  );
}

function WalkthroughTooltip({ guide, tipIndex, onNext, onClose }) {
  const tip = guide.tips[tipIndex];
  const [tooltipPos, setTooltipPos] = useState(null);
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    const selector = `[data-walkthrough="${tip.id}"]`;
    let element = document.querySelector(selector);
    let retries = 0;
    const maxRetries = 10;
    
    // If element doesn't exist yet, retry a few times
    const findAndPosition = () => {
      element = document.querySelector(selector);
      
      if (!element) {
        if (retries < maxRetries) {
          retries++;
          setTimeout(findAndPosition, 100); // Retry after 100ms
        }
        return;
      }
      
      const rect = element.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const tooltipHeight = 200;
      
      // Calculate positions
      let top, pos;
      
      // Prefer bottom if there's enough space
      if (rect.bottom + 12 + tooltipHeight < viewportHeight) {
        top = rect.bottom + 12 + scrollY;
        pos = 'bottom';
      } else {
        // Fall back to top
        top = rect.top - 12 - tooltipHeight + scrollY;
        pos = 'top';
      }
      
      const left = rect.left + rect.width / 2 - 120 + scrollX; // Center horizontally (xs = 320px ≈ 160px half)
      
      setTooltipPos({ top: Math.max(0, top), left: Math.max(0, left) });
      setPosition(pos);
    };
    
    findAndPosition();
    
    // Also update position on scroll/resize
    const handleScroll = () => findAndPosition();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [tip.id]);

  if (!tooltipPos) return null;

  const isLastStep = tipIndex === guide.tips.length - 1;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 pointer-events-auto z-30"
        onClick={onClose}
      />

      {/* Highlight element */}
      <HighlightElement elementId={tip.id} />

      {/* Tooltip bubble */}
      <div
        className="fixed bg-white rounded-lg shadow-2xl z-50 max-w-xs p-4 border-2 border-amber-400"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          animation: 'fadeIn 0.3s ease-in'
        }}
      >
        {/* Arrow pointer */}
        <div
          className="absolute w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: position === 'bottom' ? 'none' : '8px solid white',
            borderBottom: position === 'bottom' ? '8px solid white' : 'none',
            left: '50%',
            transform: 'translateX(-50%)',
            top: position === 'bottom' ? '-8px' : 'auto',
            bottom: position === 'bottom' ? 'auto' : '-8px',
            filter: 'drop-shadow(0 -1px 1px rgba(251, 191, 36, 0.4))'
          }}
        />

        {/* Content */}
        <div className="text-sm">
          <h3 className="font-semibold text-gray-800 mb-1">{tip.title}</h3>
          <p className="text-gray-600 text-xs mb-3">{tip.description}</p>
          
          {/* Step counter and buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {tipIndex + 1} / {guide.tips.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                Skip
              </button>
              <button
                onClick={isLastStep ? onClose : onNext}
                className="text-xs px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
              >
                {isLastStep ? 'Done ✓' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3), 0 0 20px #fbbf24;
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3), 0 0 30px #fbbf24;
          }
        }
      `}</style>
    </>
  );
}

// --- 5. LAYOUT COMPONENTS ---

function Layout() {
  const { view } = useNavigation();
  const { walkthroughEnabled, currentWalkthroughStep } = useAppState();
  const dispatch = useAppDispatch();
  const [walkthroughTipIndex, setWalkthroughTipIndex] = useState(0);

  // Determine the current guide based on page
  const getGuideForPage = (page) => {
    if (page === 'dashboard') return WALKTHROUGH_GUIDES.dashboard;
    if (page === 'clients') return WALKTHROUGH_GUIDES.clients;
    if (page === 'clientDetail') return WALKTHROUGH_GUIDES.clientDetail;
    if (page === 'scheduling') return WALKTHROUGH_GUIDES.scheduling;
    if (page === 'templates') return WALKTHROUGH_GUIDES.homework;
    if (page === 'help') return WALKTHROUGH_GUIDES.dashboard; // Default guide
    return null;
  };

  const currentGuide = walkthroughEnabled ? getGuideForPage(view.page) : null;

  // Reset tip index when page changes
  useEffect(() => {
    setWalkthroughTipIndex(0);
  }, [view.page]);

  const handleWalkthroughNext = () => {
    if (currentGuide && walkthroughTipIndex < currentGuide.tips.length - 1) {
      setWalkthroughTipIndex(walkthroughTipIndex + 1);
    }
  };

  const handleWalkthroughClose = () => {
    dispatch({ type: 'TOGGLE_WALKTHROUGH' });
    setWalkthroughTipIndex(0);
  };

  // The client portal has its own simple layout
  if (view.page === 'clientPortal') {
    return <ClientPortalPage homeworkId={view.id} />;
  }

  // Trainer App Layout
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <NavBar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <PageRenderer />
      </main>
      
      {/* Walkthrough Tooltip */}
      {walkthroughEnabled && currentGuide && (
        <WalkthroughTooltip
          guide={currentGuide}
          tipIndex={walkthroughTipIndex}
          onNext={handleWalkthroughNext}
          onClose={handleWalkthroughClose}
        />
      )}
    </div>
  );
}

function PageRenderer() {
  const { view } = useNavigation();
  
  switch (view.page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'clients':
      return <ClientsPage />;
    case 'clientDetail':
      return <ClientHubPage clientId={view.id} />; // --- UPDATED ---
    case 'templates':
      return <TemplatesPage />;
    // --- NEW V2 PLACEHOLDER PAGES ---
    case 'scheduling':
      return <SchedulingPage />;
    case 'help':
      return <HelpPage />;
    case 'billing':
      return <PlaceholderPage title="Billing & Payments" icon={CreditCard} />;
    default:
      return <DashboardPage />;
  }
}

function NavBar() {
  const { trainerEmail, walkthroughEnabled } = useAppState();
  const dispatch = useAppDispatch();
  const { view, toDashboard, toClients, toTemplates, toScheduling, toHelp, toBilling } = useNavigation();
  
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', action: toDashboard },
    { name: 'Clients', icon: Users, page: 'clients', action: toClients },
    { name: 'Templates', icon: ClipboardList, page: 'templates', action: toTemplates },
    // --- NEW V2 NAV ITEMS (PLACEHOLDERS) ---
    { name: 'Scheduling', icon: Calendar, page: 'scheduling', action: toScheduling },
    { name: 'Help & Docs', icon: HelpCircle, page: 'help', action: toHelp },
    { name: 'Billing', icon: CreditCard, page: 'billing', action: toBilling },
  ];
  
  return (
    <nav className="bg-white shadow-md md:shadow-none md:border-r md:w-64 p-4 md:p-6 flex flex-col shrink-0">
      <div className="flex items-center justify-between md:justify-start md:mb-8">
        <div className="flex items-center space-x-2">
          <Dog className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-800">TrainerApp</span>
        </div>
        {/* Mobile menu button could go here */}
      </div>
      
      <div className="flex-grow mt-8 md:mt-0 space-y-2">
        {navItems.map(item => (
          <Button
            key={item.name}
            variant={view.page === item.page || (item.page === 'clients' && view.page === 'clientDetail') ? 'solid' : 'ghost'}
            onClick={item.action}
            className="w-full justify-start text-lg md:text-base"
            data-walkthrough={`nav-${item.page}`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </Button>
        ))}
      </div>
      
      <div className="border-t pt-4 mt-4 space-y-2">
        {/* Walkthrough Toggle */}
        <Button
          variant={walkthroughEnabled ? 'solid' : 'ghost'}
          onClick={() => dispatch({ type: 'TOGGLE_WALKTHROUGH' })}
          className="w-full justify-start text-amber-600 hover:text-amber-700"
          title="Toggle in-app guidance tips"
        >
          <BookOpen className="h-5 w-5 mr-3" />
          <span>{walkthroughEnabled ? '✓ Guide ON' : 'Guide OFF'}</span>
        </Button>

        <p className="text-sm font-medium text-gray-700 truncate" title={trainerEmail}>
          {trainerEmail}
        </p>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'LOGOUT' })}
          className="w-full justify-start text-red-500 hover:text-red-700 mt-2"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

// --- NEW V2 COMPONENT ---
function PlaceholderPage({ title, icon: Icon }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <Card className="text-center">
        <Icon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold">Coming Soon!</h2>
        <p className="text-lg text-gray-600 mt-2">
          The {title.toLowerCase()} feature is part of our V2 plan and is currently
          under construction.
        </p>
      </Card>
    </div>
  );
}


// --- 6. PAGE COMPONENTS (Trainer-Facing) ---

function DashboardPage() {
  const { clients, homeworks, tasks } = useAppState();
  
  const homeworkList = Object.values(homeworks);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Client Compliance Dashboard
      </h1>
      
      {homeworkList.length === 0 ? (
        <Card>
          <p className="text-lg text-gray-600 text-center">
            You have no active homework plans.
          </p>
        </Card>
      ) : (
        <div className="space-y-6" data-walkthrough="homework-cards">
          {homeworkList.map(hw => {
            const client = clients[hw.clientId];
            const allTasks = Object.values(tasks).filter(t => t.homeworkId === hw.id);
            const completedTasks = allTasks.filter(t => t.isComplete).length;
            const totalTasks = allTasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            return (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                client={client}
                progress={progress}
                completedTasks={completedTasks}
                totalTasks={totalTasks}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomeworkCard({ homework, client, progress, completedTasks, totalTasks }) {
  const { toClientPortal, toClientDetail } = useNavigation();
  const [modalOpen, setModalOpen] = useState(false);
  
  const portalLink = `${window.location.origin}/portal/${homework.portalId}`;
  
  const copyLink = () => {
    // This is a more robust copy method
    const ta = document.createElement('textarea');
    ta.value = portalLink;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(ta);
    setModalOpen(true);
  };
  
  return (
    <>
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{homework.title}</h3>
            <p className="text-md text-gray-600">
              Client: {client?.name || 'N/A'}
            </p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={copyLink} data-walkthrough="copy-button">
              <Clipboard className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="solid" onClick={() => toClientPortal(homework.id)} data-walkthrough="view-portal">
              View Portal
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {completedTasks} / {totalTasks} tasks
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </Card>
      
      <Modal title="Portal Link Copied!" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <p>The link for <strong>{homework.title}</strong> has been copied to your clipboard.</p>
        <Input type="text" readOnly value={portalLink} className="mt-4" />
        <Button onClick={() => setModalOpen(false)} className="mt-4 w-full">Got it</Button>
      </Modal>
    </>
  );
}


function ClientsPage() {
  const { clients } = useAppState();
  const { toClientDetail } = useNavigation();
  const clientList = Object.values(clients);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Clients</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Add New Client</h2>
          <AddClientForm />
        </Card>
        
        <Card className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Client List</h2>
          <div className="space-y-4">
            {clientList.length > 0 ? clientList.map(client => (
              <button
                key={client.id}
                onClick={() => toClientDetail(client.id)}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
                data-walkthrough="client-card"
              >
                <div>
                  <h3 className="text-lg font-bold">{client.name}</h3>
                  <p className="text-gray-600">{client.email}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            )) : (
              <p>You haven't added any clients yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddClientForm() {
  const dispatch = useAppDispatch();
  const formRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newClient = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      // --- NEW V2 FIELDS ---
      notes: '',
      goals: []
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
    formRef.current.reset();
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <Input name="name" placeholder="Full Name" required />
      <Input name="email" type="email" placeholder="Email Address" required />
      <Input name="phone" type="tel" placeholder="Phone Number" />
      <Button type="submit" className="w-full" data-walkthrough="add-client-btn">
        <Plus className="h-4 w-4 mr-2" /> Add Client
      </Button>
    </form>
  );
}

// --- RENAMED & HEAVILY UPDATED FROM ClientDetailPage ---
function ClientHubPage({ clientId }) {
  const { clients } = useAppState();
  const { toClients } = useNavigation();
  const [tab, setTab] = useState('profile'); // 'profile', 'homework', 'goals'

  const client = clients[clientId];

  if (!client) {
    return <div><p>Client not found.</p><Button onClick={toClients}>Back to Clients</Button></div>;
  }
  
  const tabs = [
    { name: 'Profile', id: 'profile', icon: User },
    { name: 'Homework', id: 'homework', icon: ClipboardList },
    { name: 'Goals & Notes', id: 'goals', icon: Target },
  ];

  return (
    <div>
      <Button variant="ghost" onClick={toClients} className="mb-4">
        &larr; Back to all clients
      </Button>
      <h1 className="text-3xl font-bold">{client.name}</h1>
      <p className="text-lg text-gray-600">{client.email} | {client.phone}</p>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mt-6 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((t) => (
            <button
              key={t.name}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              data-walkthrough={t.id === 'homework' ? 'homework-tab' : (t.id === 'goals' ? 'edit-client-details' : undefined)}
            >
              <t.icon className="h-5 w-5 mr-2" />
              {t.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'profile' && <ClientProfileTab client={client} />}
        {tab === 'homework' && <ClientHomeworkTab client={client} />}
        {tab === 'goals' && <ClientGoalsTab client={client} />}
      </div>
    </div>
  );
}

// --- NEW V2 COMPONENT ---
function ClientProfileTab({ client }) {
  const { pets } = useAppState();
  const clientPets = Object.values(pets).filter(p => p.clientId === client.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Pets</h2>
        <div className="space-y-4">
          {clientPets.length === 0 && (
            <p>{client.name} has no pets added yet.</p>
          )}
          {clientPets.map(pet => (
            <Card key={pet.id}>
              <div className="flex items-center space-x-4 mb-4">
                <Dog className="h-10 w-10 text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold">{pet.name}</h3>
                  <p className="text-gray-600">{pet.breed || 'N/A'}, {pet.age ? `${pet.age} years old` : 'Age N/A'}</p>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-700">Skill Level</h4>
              <p className="mb-2">{pet.skillLevel || 'Not set'}</p>

              <h4 className="font-semibold text-gray-700">Behavioral Concerns</h4>
              <p>{pet.concerns || 'Not set'}</p>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Add New Pet</h2>
        <Card>
          <AddPetForm clientId={client.id} />
        </Card>
      </div>
    </div>
  );
}

// --- NEW V2 COMPONENT ---
function ClientHomeworkTab({ client }) {
  const { homeworks, tasks, templates } = useAppState();
  const clientHomeworks = Object.values(homeworks).filter(hw => hw.clientId === client.id);
  const templateList = Object.values(templates);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Assign Homework</h2>
        <Card>
          <AssignmentForm clientId={client.id} templates={templateList} />
        </Card>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Assigned Plans</h2>
        {clientHomeworks.length > 0 ? (
          <div className="space-y-4">
            {clientHomeworks.map(hw => {
              const allTasks = Object.values(tasks).filter(t => t.homeworkId === hw.id);
              const completedTasks = allTasks.filter(t => t.isComplete).length;
              const totalTasks = allTasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
              return (
                <HomeworkCard
                  key={hw.id}
                  homework={hw}
                  client={client}
                  progress={progress}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                />
              );
            })}
          </div>
        ) : (
          <p>{client.name} has no homework assigned yet.</p>
        )}
      </div>
    </div>
  );
}

// --- NEW V2 COMPONENT ---
function ClientGoalsTab({ client }) {
  const dispatch = useAppDispatch();
  const [notes, setNotes] = useState(client.notes);
  const [goalText, setGoalText] = useState('');
  
  const handleSaveNotes = () => {
    dispatch({ type: 'UPDATE_CLIENT_NOTES', payload: { clientId: client.id, notes } });
    // Here you'd show a "Saved!" toast
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    dispatch({ type: 'ADD_CLIENT_GOAL', payload: { clientId: client.id, goalText } });
    setGoalText('');
  };
  
  const handleToggleGoal = (goalId) => {
    dispatch({ type: 'TOGGLE_CLIENT_GOAL', payload: { clientId: client.id, goalId } });
  };

  // Predefined goals list
  const predefinedGoals = [
    'Pass Canine Good Citizen (CGC) test',
    'Walk calmly past other dogs',
    'Improve recall/\"Come\" command',
    'Stop jumping on guests',
    'Reduce leash pulling',
    'Build confidence with strangers',
    'Resolve separation anxiety',
    'Master basic obedience',
    'Improve focus and attention',
    'Desensitize to loud noises',
    'Improve socialization',
    'End resource guarding behavior'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Client Goals</h2>
        
        <form onSubmit={handleAddGoal} className="space-y-3 mb-4">
          <Select 
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
          >
            <option value="">Select a goal...</option>
            {predefinedGoals.map(goal => (
              <option key={goal} value={goal}>{goal}</option>
            ))}
          </Select>
          <Input 
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Or type a custom goal..."
          />
          <Button type="submit" className="w-full">Add</Button>
        </form>

        <div className="space-y-3">
          {client.goals.map(goal => (
            <label
              key={goal.id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={goal.isComplete}
                onChange={() => handleToggleGoal(goal.id)}
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className={`ml-3 ${goal.isComplete ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {goal.text}
              </span>
            </label>
          ))}
          {client.goals.length === 0 && (
            <p className="text-gray-500">No goals set yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold mb-4">Private Trainer Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded-md"
          placeholder="Add notes about this client..."
        />
        <Button onClick={handleSaveNotes} className="mt-4 w-full">
          Save Notes
        </Button>
      </Card>
    </div>
  );
}


function AddPetForm({ clientId }) {
  const dispatch = useAppDispatch();
  const formRef = useRef(null);
  const [breedMode, setBreedMode] = useState('select'); // 'select' or 'custom'

  // Common dog breeds
  const breeds = [
    'Golden Retriever',
    'Labrador Retriever',
    'German Shepherd',
    'French Bulldog',
    'Bulldog',
    'Poodle',
    'Beagle',
    'Yorkshire Terrier',
    'Dachshund',
    'Husky',
    'Chihuahua',
    'Boxer',
    'Rottweiler',
    'Shih Tzu',
    'Maltese',
    'Cocker Spaniel',
    'Border Collie',
    'Pug',
    'Australian Shepherd',
    'Miniature Pinscher',
    'Mixed Breed',
    'Other'
  ];

  // Age options (in years)
  const ages = Array.from({ length: 16 }, (_, i) => i + 1); // 1-16 years

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPet = {
      clientId: clientId,
      name: formData.get('name'),
      breed: breedMode === 'select' ? formData.get('breed') : formData.get('customBreed'),
      age: formData.get('age') ? parseInt(formData.get('age'), 10) : null,
      // --- NEW V2 FIELDS ---
      skillLevel: formData.get('skillLevel'),
      concerns: formData.get('concerns')
    };
    dispatch({ type: 'ADD_PET', payload: newPet });
    formRef.current.reset();
    setBreedMode('select');
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <Input name="name" placeholder="Pet's Name" required />
      
      <div>
        <label className="block text-sm font-medium mb-2">Breed</label>
        <div className="flex space-x-2 mb-2">
          <button
            type="button"
            onClick={() => setBreedMode('select')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              breedMode === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            From List
          </button>
          <button
            type="button"
            onClick={() => setBreedMode('custom')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              breedMode === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Custom
          </button>
        </div>
        
        {breedMode === 'select' ? (
          <Select name="breed" required>
            <option value="">Select Breed</option>
            {breeds.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </Select>
        ) : (
          <Input 
            name="customBreed" 
            placeholder="Enter breed name" 
            required 
          />
        )}
      </div>
      
      <Select name="age" required>
        <option value="">Select Age (years)</option>
        {ages.map(age => (
          <option key={age} value={age}>{age} {age === 1 ? 'year' : 'years'}</option>
        ))}
      </Select>
      
      {/* --- NEW V2 FIELDS --- */}
      <Select name="skillLevel">
        <option value="">Select Skill Level</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </Select>
      <Input name="concerns" placeholder="Behavioral Concerns (e.g., pulling)" />
      {/* --- END V2 FIELDS --- */}
      
      <Button type="submit" className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Pet
      </Button>
    </form>
  );
}

function AssignmentForm({ clientId, templates }) {
  const dispatch = useAppDispatch();
  const formRef = useRef(null);
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState(['']); // Array of task description strings
  
  // Predefined tasks list
  const predefinedTasks = [
    'Practice "Sit" (5 mins, 2x daily)',
    'Practice "Stay" (10 mins)',
    'Practice "Down" command (5 mins)',
    'Loose leash walking practice (15 mins)',
    '"Look at me" game (5 mins)',
    'Recall practice with treats (10 mins)',
    'Crate games (10 mins)',
    'Handling & grooming (5 mins)',
    'Separation practice (2-5 mins)',
    'Frozen Kong/LickiMat session',
    'Hide-and-seek recall game',
    'Desensitization walks',
    'Socialization outing',
    'Impulse control exercises'
  ];
  
  const handleTemplateChange = (templateId) => {
    if (!templateId) {
      setTitle('');
      setTasks(['']);
      return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setTasks(template.tasks.length > 0 ? template.tasks : ['']);
    }
  };
  
  const handleTaskChange = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };
  
  const handleAddPredefinedTask = (task) => {
    const newTasks = [...tasks];
    if (newTasks[newTasks.length - 1] === '') {
      newTasks[newTasks.length - 1] = task;
    } else {
      newTasks.push(task);
    }
    setTasks(newTasks);
  };
  
  const handleAddTask = () => {
    setTasks([...tasks, '']);
  };
  
  const handleRemoveTask = (index) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const nonEmptyTasks = tasks.filter(t => t.trim() !== '');
    if (nonEmptyTasks.length === 0) {
      alert("Please add at least one task."); // Simple alert is ok for form validation
      return;
    }
    dispatch({
      type: 'ASSIGN_HOMEWORK',
      payload: { clientId, title, tasks: nonEmptyTasks }
    });
    // Reset form
    formRef.current.reset();
    setTitle('');
    setTasks(['']);
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Select onChange={(e) => handleTemplateChange(e.target.value)} data-walkthrough="template-select">
        <option value="">Start from scratch...</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </Select>
      
      <Input 
        name="title" 
        placeholder="Assignment Title" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        required 
      />
      
      <div data-walkthrough="task-list">
        <label className="block text-sm font-medium mb-2">Tasks</label>
        
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
          <label className="block text-xs font-medium text-gray-600 mb-2">Quick Add from List:</label>
          <Select onChange={(e) => {
            if (e.target.value) {
              handleAddPredefinedTask(e.target.value);
              e.target.value = '';
            }
          }}>
            <option value="">Select a predefined task...</option>
            {predefinedTasks.map(task => (
              <option key={task} value={task}>{task}</option>
            ))}
          </Select>
        </div>
        
        {tasks.map((task, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <Input
              name="task"
              placeholder={`Task ${index + 1}`}
              value={task}
              onChange={(e) => handleTaskChange(index, e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => handleRemoveTask(index)} className="text-red-500">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={handleAddTask}>
          + Add Task
        </Button>
      </div>
      
      <Button type="submit" className="w-full" data-walkthrough="assign-btn">
        Assign Homework
      </Button>
    </form>
  );
}

// --- NEW: HELP & DOCUMENTATION PAGE ---

function HelpPage() {
  const { toHelp } = useNavigation();
  const [selectedGuide, setSelectedGuide] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [showTutorialVideo, setShowTutorialVideo] = useState(null);

  const guides = [
    {
      title: 'Getting Started',
      icon: LayoutDashboard,
      description: 'Learn the basics of TrainerApp',
      tutorialSteps: [
        { title: 'Welcome Screen', description: 'This is your first view - the Help & Documentation page', videoUrl: 'https://media.example.com/tutorial-1-welcome.mp4' },
        { title: 'Navigate to Dashboard', description: 'Click Dashboard to see all active homework assignments', videoUrl: 'https://media.example.com/tutorial-1-dashboard.mp4' },
        { title: 'Open Clients Tab', description: 'Go to Clients to add your first client', videoUrl: 'https://media.example.com/tutorial-1-clients.mp4' },
        { title: 'Add a Client', description: 'Click Add Client and fill in their name, email, and phone', videoUrl: 'https://media.example.com/tutorial-1-add-client.mp4' },
        { title: 'Success!', description: 'Your first client is ready! Now add their pets', videoUrl: 'https://media.example.com/tutorial-1-success.mp4' }
      ],
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Welcome to TrainerApp! 👋</h3>
            <p className="text-blue-800 text-sm mb-3">TrainerApp helps you manage dog training clients, create homework assignments, schedule sessions, and track progress.</p>
          </div>
          <div className="space-y-3">
            <GuideStep step={1} title="Add Your First Client" description="Navigate to Clients and click 'Add Client' to create a new client profile with their contact information." />
            <GuideStep step={2} title="Add Pets" description="For each client, add their pets including breed, age, skill level, and any behavioral concerns." />
            <GuideStep step={3} title="Create Homework" description="Assign training homework with specific tasks and deadlines for clients to complete at home." />
            <GuideStep step={4} title="Schedule Sessions" description="Book training sessions on the calendar, assign tasks, and share with clients." />
            <GuideStep step={5} title="Track Progress" description="Monitor task completion, client goals, and training sessions through the dashboard." />
          </div>
          <Button onClick={() => setShowTutorialVideo(0)} className="w-full mt-4">
            ▶ Watch Tutorial Video
          </Button>
        </div>
      )
    },
    {
      title: 'Managing Clients',
      icon: Users,
      description: 'Add, edit, and organize clients',
      tutorialSteps: [
        { title: 'Go to Clients Tab', description: 'Click on Clients in the left sidebar', videoUrl: 'https://media.example.com/tutorial-2-clients-tab.mp4' },
        { title: 'Click Add Client', description: 'Fill in name, email, and phone number', videoUrl: 'https://media.example.com/tutorial-2-add-client.mp4' },
        { title: 'Save Client Info', description: 'Client profile is created and ready', videoUrl: 'https://media.example.com/tutorial-2-save-client.mp4' },
        { title: 'Add a Pet', description: 'Click Add Pet and fill in breed, age, and skill level', videoUrl: 'https://media.example.com/tutorial-2-add-pet.mp4' },
        { title: 'View Profile', description: 'Click on client to see full profile with goals and pets', videoUrl: 'https://media.example.com/tutorial-2-view-profile.mp4' }
      ],
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-900 mb-2">Client Management 👥</h3>
            <p className="text-green-800 text-sm">Keep all your client information organized and accessible in one place.</p>
          </div>
          <div className="space-y-3">
            <GuideStep 
              step={1} 
              title="Adding a Client" 
              description="Click 'Add Client' in the Clients tab. Enter their name, email, and phone number. You can also add notes about the client." 
            />
            <GuideStep 
              step={2} 
              title="Adding Pets" 
              description="Inside a client's profile, add their dogs with breed, age, skill level, and behavioral concerns. Use the dropdown for common breeds or enter custom breeds." 
            />
            <GuideStep 
              step={3} 
              title="Client Goals & Notes" 
              description="Set training goals for the client (e.g., 'Pass CGC test') and add private trainer notes about their progress and preferences." 
            />
            <GuideStep 
              step={4} 
              title="View Client Details" 
              description="Click on any client to see their full profile including goals, pets, and homework assignments." 
            />
          </div>
          <Button onClick={() => setShowTutorialVideo(1)} className="w-full mt-4">
            ▶ Watch Tutorial Video
          </Button>
        </div>
      )
    },
    {
      title: 'Creating Homework',
      icon: ClipboardList,
      description: 'Assign training tasks to clients',
      tutorialSteps: [
        { title: 'Go to Client Hub', description: 'Click on a client to open their profile hub', videoUrl: 'https://media.example.com/tutorial-3-client-hub.mp4' },
        { title: 'Open Homework Tab', description: 'Click the Homework tab', videoUrl: 'https://media.example.com/tutorial-3-homework-tab.mp4' },
        { title: 'Choose Template', description: 'Select from stock templates or start from scratch', videoUrl: 'https://media.example.com/tutorial-3-choose-template.mp4' },
        { title: 'Add Tasks', description: 'Select predefined tasks or create custom ones', videoUrl: 'https://media.example.com/tutorial-3-add-tasks.mp4' },
        { title: 'Assign & Share', description: 'Click "Assign Homework" and copy the portal link to share', videoUrl: 'https://media.example.com/tutorial-3-assign-share.mp4' }
      ],
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-bold text-purple-900 mb-2">Homework Assignments 📋</h3>
            <p className="text-purple-800 text-sm">Create structured training assignments with specific tasks for your clients to practice at home.</p>
          </div>
          <div className="space-y-3">
            <GuideStep 
              step={1} 
              title="Start from Template" 
              description="Use pre-built templates (Puppy Basics, Leash Manners, etc.) or start from scratch for quick creation." 
            />
            <GuideStep 
              step={2} 
              title="Add Tasks" 
              description="Select from predefined tasks like 'Practice Sit (5 mins, 2x daily)' or create custom tasks. You can add multiple tasks to one assignment." 
            />
            <GuideStep 
              step={3} 
              title="Assign to Client" 
              description="Select the client and pet, give the homework a title, and assign it. The client receives a unique portal link." 
            />
            <GuideStep 
              step={4} 
              title="Share Portal Link" 
              description="Click 'Copy Link' to get the shareable portal. Send it to your client so they can track progress and mark tasks complete." 
            />
          </div>
          <Button onClick={() => setShowTutorialVideo(2)} className="w-full mt-4">
            ▶ Watch Tutorial Video
          </Button>
        </div>
      )
    },
    {
      title: 'Scheduling Sessions',
      icon: Calendar,
      description: 'Book and manage training sessions',
      tutorialSteps: [
        { title: 'Go to Scheduling', description: 'Click Scheduling tab in the left sidebar', videoUrl: 'https://media.example.com/tutorial-4-scheduling.mp4' },
        { title: 'Click on a Date', description: 'Click any date on the calendar to create a session', videoUrl: 'https://media.example.com/tutorial-4-click-date.mp4' },
        { title: 'Fill Session Details', description: 'Enter client, pet, title, date/time, and location', videoUrl: 'https://media.example.com/tutorial-4-session-details.mp4' },
        { title: 'Assign Tasks', description: 'Add training tasks from the predefined list', videoUrl: 'https://media.example.com/tutorial-4-assign-tasks.mp4' },
        { title: 'Share Session', description: 'Click Share button to notify the client', videoUrl: 'https://media.example.com/tutorial-4-share.mp4' }
      ],
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-bold text-orange-900 mb-2">Training Sessions 📅</h3>
            <p className="text-orange-800 text-sm">Schedule, edit, and share training sessions with your clients using the interactive calendar.</p>
          </div>
          <div className="space-y-3">
            <GuideStep 
              step={1} 
              title="Create a Session" 
              description="Click any date on the calendar or use 'New Session' button. Fill in client name, pet, title, date/time, duration, and location." 
            />
            <GuideStep 
              step={2} 
              title="Assign Tasks" 
              description="Add specific training tasks to each session. Select from predefined tasks or create custom ones relevant to the session." 
            />
            <GuideStep 
              step={3} 
              title="Share with Client" 
              description="Click the 'Share' button to share the session details with your client. They'll see it in their portal." 
            />
            <GuideStep 
              step={4} 
              title="Edit or Delete" 
              description="Click any session on the calendar to edit details or delete if needed. Changes update immediately." 
            />
            <GuideStep 
              step={5} 
              title="Upcoming Sessions" 
              description="View your next 5 sessions in the right panel. Click to edit or see full details." 
            />
          </div>
          <Button onClick={() => setShowTutorialVideo(3)} className="w-full mt-4">
            ▶ Watch Tutorial Video
          </Button>
        </div>
      )
    },
    {
      title: 'Dashboard & Tracking',
      icon: Target,
      description: 'Monitor client progress',
      tutorialSteps: [
        { title: 'Go to Dashboard', description: 'Click Dashboard tab in the left sidebar', videoUrl: 'https://media.example.com/tutorial-5-dashboard.mp4' },
        { title: 'View Active Assignments', description: 'See all homework assignments organized by client', videoUrl: 'https://media.example.com/tutorial-5-assignments.mp4' },
        { title: 'Check Progress Bar', description: 'Each assignment shows a progress bar for task completion', videoUrl: 'https://media.example.com/tutorial-5-progress.mp4' },
        { title: 'Click View Portal', description: 'See detailed task breakdown for any assignment', videoUrl: 'https://media.example.com/tutorial-5-view-portal.mp4' },
        { title: 'Share Links', description: 'Use Copy Link to reshare portal with clients', videoUrl: 'https://media.example.com/tutorial-5-share.mp4' }
      ],
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="font-bold text-indigo-900 mb-2">Progress Tracking 📊</h3>
            <p className="text-indigo-800 text-sm">See all your active homework assignments and track completion progress.</p>
          </div>
          <div className="space-y-3">
            <GuideStep 
              step={1} 
              title="Dashboard Overview" 
              description="The dashboard shows all active homework assignments organized by client. Each assignment displays a progress bar." 
            />
            <GuideStep 
              step={2} 
              title="Check Progress" 
              description="See how many tasks are completed out of the total. Click 'View Portal' to see detailed task breakdown." 
            />
            <GuideStep 
              step={3} 
              title="Copy Client Portal" 
              description="Use the 'Copy Link' button to quickly share the portal with a client if they need the link again." 
            />
          </div>
          <Button onClick={() => setShowTutorialVideo(4)} className="w-full mt-4">
            ▶ Watch Tutorial Video
          </Button>
        </div>
      )
    }
  ];

  const faqs = [
    {
      q: 'Can I edit a client after creating them?',
      a: 'Yes! Click on any client in the Clients tab to view and edit their information. Changes are saved immediately.'
    },
    {
      q: 'What happens when I share a homework assignment?',
      a: 'The client receives a unique portal link where they can view tasks, mark them as complete, and see progress. They can access it without logging in.'
    },
    {
      q: 'Can I use the same template for multiple clients?',
      a: 'Absolutely! Templates are reusable. Select from stock templates or your custom templates when creating homework assignments.'
    },
    {
      q: 'How do I schedule recurring sessions?',
      a: 'Currently, each session is created individually. You can create multiple sessions on different dates for recurring training (next version will have recurring options).'
    },
    {
      q: 'Can clients see training sessions I schedule?',
      a: 'Yes, when you share a session, the client receives notification and can see it in their portal with full details including location and assigned tasks.'
    },
    {
      q: 'What if a client completes a task early?',
      a: 'Clients can mark tasks as complete any time through their portal. The progress bar updates in real-time on your dashboard.'
    },
    {
      q: 'How do I add custom goals for a client?',
      a: 'In the client hub, go to "Goals & Notes". You can select from predefined goals or type a custom goal. Goals can be marked complete to track progress.'
    },
    {
      q: 'Is there a way to export client data?',
      a: 'This feature is coming in future versions. For now, all data is stored securely and accessible through the app.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Help & Documentation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Guide Navigator */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <h2 className="text-lg font-bold mb-4">Guides</h2>
            <div className="space-y-2">
              {guides.map((guide, idx) => {
                const Icon = guide.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedGuide(idx)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedGuide === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{guide.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selected Guide */}
          <Card>
            <div className="flex items-center space-x-4 mb-4">
              {React.createElement(guides[selectedGuide].icon, { className: 'h-8 w-8 text-blue-600' })}
              <div>
                <h2 className="text-2xl font-bold">{guides[selectedGuide].title}</h2>
                <p className="text-gray-600">{guides[selectedGuide].description}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              {guides[selectedGuide].content}
            </div>
          </Card>

          {/* FAQs */}
          <Card>
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{faq.q}</span>
                    <ChevronRight
                      className={`h-5 w-5 text-gray-600 transition-transform ${
                        expandedFAQ === idx ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {expandedFAQ === idx && (
                    <div className="p-4 bg-white border-t">
                      <p className="text-gray-700">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Tips & Tricks */}
          <Card>
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-green-600" />
              <span>Pro Tips</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-green-900 mb-2">💡 Quick Templates</h3>
                <p className="text-sm text-green-800">Use stock templates to quickly assign common homework packages. Customize them as needed.</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">📱 Share Easily</h3>
                <p className="text-sm text-blue-800">One-click sharing for homework and sessions. Clients access portals without creating accounts.</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-2">📅 Calendar View</h3>
                <p className="text-sm text-purple-800">Click any date to quickly create a session. Navigate months to see your full schedule.</p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-bold text-orange-900 mb-2">🎯 Track Progress</h3>
                <p className="text-sm text-orange-800">Use goals and notes to track each client's journey. Check dashboard for completion rates.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tutorial Video Modal */}
      {showTutorialVideo !== null && (
        <TutorialVideoModal
          tutorialIndex={showTutorialVideo}
          steps={guides[showTutorialVideo]?.tutorialSteps || []}
          guideTitle={guides[showTutorialVideo]?.title || ''}
          onClose={() => setShowTutorialVideo(null)}
        />
      )}
    </div>
  );
}

function GuideStep({ step, title, description }) {
  return (
    <div className="flex space-x-4 pb-3 border-b border-gray-200 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
          {step}
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

// Animated Tutorial Screen Component with Real App Design
function AnimatedTutorialScreen({ step, guideTitle, tutorialIndex, currentStep, totalSteps }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let frame = 0;

    const drawRoundRect = (ctx, x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const animate = () => {
      frame++;

      // Background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw real app UI
      const time = frame % 120;

      // Navbar
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 5;
      ctx.fillRect(0, 0, canvas.width, 60);
      ctx.shadowColor = 'transparent';

      // Navbar content
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      ctx.fillText('TrainerApp', 16, 37);

      // Sidebar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 60, 220, canvas.height - 60);
      
      // Sidebar border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(220, 60);
      ctx.lineTo(220, canvas.height);
      ctx.stroke();

      // Nav items
      const navItems = ['Dashboard', 'Clients', 'Templates', 'Scheduling', 'Help & Docs'];
      navItems.forEach((item, idx) => {
        const y = 80 + idx * 45;
        if (idx === currentStep) {
          ctx.fillStyle = '#3b82f6';
          drawRoundRect(ctx, 12, y - 18, 200, 35, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#6b7280';
        }
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.fillText(item, 30, y + 5);
      });

      // Content area
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(220, 60, canvas.width - 220, canvas.height - 60);

      // Tutorial-specific content
      if (tutorialIndex === 0) {
        drawGettingStartedContent(ctx, currentStep, time, canvas, drawRoundRect);
      } else if (tutorialIndex === 1) {
        drawManagingClientsContent(ctx, currentStep, time, canvas, drawRoundRect);
      } else if (tutorialIndex === 2) {
        drawHomeworkContent(ctx, currentStep, time, canvas, drawRoundRect);
      } else if (tutorialIndex === 3) {
        drawSchedulingContent(ctx, currentStep, time, canvas, drawRoundRect);
      } else if (tutorialIndex === 4) {
        drawDashboardContent(ctx, currentStep, time, canvas, drawRoundRect);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [tutorialIndex, currentStep, step]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={500}
      className="w-full rounded-lg border border-gray-200 bg-white"
      style={{ maxHeight: '450px' }}
    />
  );
}

function drawGettingStartedContent(ctx, step, time, canvas, drawRoundRect) {
  const contentX = 250;
  const contentY = 100;

  if (step === 0) {
    // Welcome screen with hero content
    ctx.fillStyle = '#dbeafe';
    drawRoundRect(ctx, contentX, contentY, 300, 150, 8);
    ctx.fill();

    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 20px -apple-system';
    ctx.fillText('Welcome to TrainerApp! 👋', contentX + 20, contentY + 35);

    ctx.fillStyle = '#1e40af';
    ctx.font = '13px -apple-system';
    ctx.fillText('Manage dog training clients, create', contentX + 20, contentY + 60);
    ctx.fillText('homework assignments, schedule sessions,', contentX + 20, contentY + 78);
    ctx.fillText('and track progress.', contentX + 20, contentY + 96);

    // Animated cursor
    const cursorX = contentX + 50 + Math.sin(time / 40) * 80;
    const cursorY = contentY + 80 + Math.cos(time / 40) * 40;
    drawCursor(ctx, cursorX, cursorY);
  } else if (step === 1) {
    // Dashboard button highlight
    const dashboardY = 80 + 45;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    drawRoundRect(ctx, 12, dashboardY - 18, 200, 35, 6);
    ctx.stroke();

    ctx.fillStyle = '#333333';
    ctx.font = '13px -apple-system';
    ctx.fillText('See all active homework assignments', contentX + 20, contentY + 100);

    const cursorX = 112 + (time / 120) * 300;
    const cursorY = dashboardY - (time / 120) * 100;
    drawCursor(ctx, cursorX, cursorY);
    if (time > 60) drawClickRipple(ctx, 112, dashboardY, 20 + ((time - 60) / 60) * 40);
  } else if (step === 2) {
    // Clients button highlight
    const clientsY = 80 + 90;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    drawRoundRect(ctx, 12, clientsY - 18, 200, 35, 6);
    ctx.stroke();

    ctx.fillStyle = '#333333';
    ctx.font = '13px -apple-system';
    ctx.fillText('Go to Clients to add your first client', contentX + 20, contentY + 100);

    const cursorX = 112 + (time / 120) * 300;
    const cursorY = clientsY - (time / 120) * 100;
    drawCursor(ctx, cursorX, cursorY);
    if (time > 60) drawClickRipple(ctx, 112, clientsY, 20 + ((time - 60) / 60) * 40);
  } else if (step === 3) {
    // Add Client form
    const formX = contentX + 20;
    const formY = contentY;
    
    ctx.fillStyle = '#dbeafe';
    drawRoundRect(ctx, formX, formY, 300, 180, 8);
    ctx.fill();

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px -apple-system';
    ctx.fillText('Add Client', formX + 15, formY + 35);

    ctx.fillStyle = '#374151';
    ctx.font = '12px -apple-system';
    ctx.fillText('Name:', formX + 15, formY + 65);
    drawTextInput(ctx, formX + 100, formY + 53, 180, 24, 'John Smith');

    ctx.fillText('Email:', formX + 15, formY + 105);
    drawTextInput(ctx, formX + 100, formY + 93, 180, 24, 'john@example.com');

    ctx.fillText('Phone:', formX + 15, formY + 145);
    drawTextInput(ctx, formX + 100, formY + 133, 180, 24, '(555) 123-4567');

    // Submit button
    ctx.fillStyle = '#10b981';
    drawRoundRect(ctx, formX + 15, formY + 155, 100, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system';
    ctx.fillText('Add Client', formX + 30, formY + 178);

    const cursorX = formX + 50 + (time / 60) * 150;
    const cursorY = formY + 70 + (time / 120) * 120;
    drawCursor(ctx, cursorX, cursorY);
  } else if (step === 4) {
    // Success animation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#dcfce7';
    drawRoundRect(ctx, centerX - 130, centerY - 70, 260, 140, 12);
    ctx.fill();

    const scale = 1 + Math.sin(time / 30) * 0.1;
    ctx.save();
    ctx.translate(centerX, centerY - 20);
    ctx.scale(scale, scale);
    ctx.font = '48px Arial';
    ctx.fillText('✓', -20, 10);
    ctx.restore();

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 20px -apple-system';
    ctx.fillText('Success!', centerX - 50, centerY + 20);

    ctx.fillStyle = '#166534';
    ctx.font = '13px -apple-system';
    ctx.fillText('Your first client is ready!', centerX - 90, centerY + 50);
  }
}

function drawManagingClientsContent(ctx, step, time, canvas, drawRoundRect) {
  const contentX = 250;
  const contentY = 100;

  if (step === 0) {
    ctx.fillStyle = '#d1d5db';
    ctx.font = 'bold 16px -apple-system';
    ctx.fillText('Click on Clients in the sidebar', contentX + 20, contentY + 50);
  } else if (step === 1) {
    // Client list with add button
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, contentX + 20, contentY, 300, 200, 8);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px -apple-system';
    ctx.fillText('Clients', contentX + 35, contentY + 30);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system';
    ctx.fillText('Sarah Johnson', contentX + 35, contentY + 65);
    ctx.fillText('john@example.com', contentX + 35, contentY + 82);

    // Add Client button
    ctx.fillStyle = '#3b82f6';
    drawRoundRect(ctx, contentX + 35, contentY + 155, 120, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system';
    ctx.fillText('+ Add Client', contentX + 48, contentY + 177);

    const cursorX = contentX + 35 + (time / 60) * 120;
    const cursorY = contentY + 155 + (time / 120) * 50;
    drawCursor(ctx, cursorX, cursorY);
  } else if (step === 2 || step === 3) {
    // Client detail view with pets section
    ctx.fillStyle = '#f3f4f6';
    drawRoundRect(ctx, contentX + 20, contentY, 350, 240, 8);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px -apple-system';
    ctx.fillText('John Smith', contentX + 35, contentY + 30);

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system';
    ctx.fillText('john@example.com | (555) 123-4567', contentX + 35, contentY + 55);

    ctx.fillText('Pets:', contentX + 35, contentY + 85);
    ctx.fillStyle = '#3b82f6';
    ctx.font = '11px -apple-system';
    ctx.fillText('Max (Golden Retriever, 3 years)', contentX + 50, contentY + 110);
    ctx.fillText('Luna (Lab, 2 years)', contentX + 50, contentY + 130);

    // Add Pet button
    if (step === 3) {
      ctx.fillStyle = '#10b981';
      drawRoundRect(ctx, contentX + 35, contentY + 190, 100, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system';
      ctx.fillText('+ Add Pet', contentX + 48, contentY + 212);

      const cursorX = contentX + 35 + (time / 60) * 100;
      const cursorY = contentY + 190 + (time / 120) * 50;
      drawCursor(ctx, cursorX, cursorY);
      if (time > 60) drawClickRipple(ctx, contentX + 85, contentY + 206, 20 + ((time - 60) / 60) * 30);
    }
  } else if (step === 4) {
    ctx.fillStyle = '#333333';
    ctx.font = '13px -apple-system';
    ctx.fillText('Full client profile with goals and pets', contentX + 20, contentY + 100);
  }
}

function drawHomeworkContent(ctx, step, time, canvas, drawRoundRect) {
  const contentX = 250;
  const contentY = 100;

  if (step === 0) {
    ctx.fillStyle = '#333333';
    ctx.font = '12px -apple-system';
    ctx.fillText('Open a client to access homework options', contentX + 20, contentY + 100);
  } else if (step === 1 || step === 2) {
    // Template selection
    ctx.fillStyle = '#dbeafe';
    drawRoundRect(ctx, contentX + 20, contentY, 310, 220, 8);
    ctx.fill();

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px -apple-system';
    ctx.fillText('Choose Template or Start Fresh', contentX + 35, contentY + 25);

    const templates = ['Puppy Basics: Week 1', 'Leash Manners: Stop Pulling', 'Recall: Come When Called'];
    templates.forEach((template, idx) => {
      const y = contentY + 60 + idx * 45;
      ctx.fillStyle = '#3b82f6';
      drawRoundRect(ctx, contentX + 35, y, 280, 35, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px -apple-system';
      ctx.fillText(template, contentX + 50, y + 24);
    });

    const cursorX = contentX + 35 + (time / 60) * 200;
    const cursorY = contentY + 80 + ((time / 120) % 1) * 90;
    drawCursor(ctx, cursorX, cursorY);
  } else if (step === 3) {
    // Task selection
    ctx.fillStyle = '#dcfce7';
    drawRoundRect(ctx, contentX + 20, contentY, 310, 220, 8);
    ctx.fill();

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 14px -apple-system';
    ctx.fillText('Add Training Tasks', contentX + 35, contentY + 25);

    const tasks = ['Practice Sit (5 mins, 2x daily)', 'Crate games (10 mins)', 'Leash walking (15 mins)'];
    tasks.forEach((task, idx) => {
      const y = contentY + 60 + idx * 45;
      ctx.fillStyle = '#10b981';
      drawRoundRect(ctx, contentX + 35, y, 280, 35, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px -apple-system';
      ctx.fillText('✓ ' + task, contentX + 50, y + 24);
    });
  } else if (step === 4) {
    // Share portal
    ctx.fillStyle = '#3b82f6';
    drawRoundRect(ctx, contentX + 20, contentY + 50, 310, 120, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system';
    ctx.fillText('Portal Link Ready to Share', contentX + 35, contentY + 80);

    ctx.font = '11px -apple-system';
    ctx.fillText('trainer-portal.link/hw-abc123xyz', contentX + 35, contentY + 110);

    const scale = 1 + Math.sin(time / 25) * 0.12;
    ctx.save();
    ctx.translate(contentX + 280, contentY + 90);
    ctx.scale(scale, scale);
    ctx.font = '28px Arial';
    ctx.fillText('🔗', -15, 0);
    ctx.restore();
  }
}

function drawSchedulingContent(ctx, step, time, canvas, drawRoundRect) {
  const contentX = 250;
  const contentY = 100;

  if (step === 0) {
    ctx.fillStyle = '#333333';
    ctx.font = '12px -apple-system';
    ctx.fillText('Click Scheduling tab to view the calendar', contentX + 20, contentY + 100);
  } else if (step === 1) {
    // Calendar view
    drawCalendarUI(ctx, contentX + 20, contentY, time, drawRoundRect);

    const cursorX = contentX + 80 + (time / 120) * 200;
    const cursorY = contentY + 50 + (time / 120) * 150;
    drawCursor(ctx, cursorX, cursorY);
    if (time > 60) drawClickRipple(ctx, contentX + 150, contentY + 130, 20 + ((time - 60) / 60) * 30);
  } else if (step === 2) {
    // Session details form
    drawSessionForm(ctx, contentX + 20, contentY, drawRoundRect);
  } else if (step === 3) {
    ctx.fillStyle = '#333333';
    ctx.font = '12px -apple-system';
    ctx.fillText('Assign training tasks to the session', contentX + 20, contentY + 100);
  } else if (step === 4) {
    // Share confirmation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#dcfce7';
    drawRoundRect(ctx, centerX - 110, centerY - 50, 220, 100, 12);
    ctx.fill();

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 14px -apple-system';
    ctx.fillText('Session Shared!', centerX - 60, centerY - 15);

    ctx.font = '11px -apple-system';
    ctx.fillText('Client has been notified', centerX - 75, centerY + 20);
  }
}

function drawDashboardContent(ctx, step, time, canvas, drawRoundRect) {
  const contentX = 250;
  const contentY = 100;

  if (step === 0) {
    ctx.fillStyle = '#333333';
    ctx.font = '12px -apple-system';
    ctx.fillText('Dashboard shows all active homework assignments', contentX + 20, contentY + 100);
  } else {
    // Show homework cards with progress bars
    const homework = [
      { name: 'John Smith - Max', progress: (time / 120) * 100 },
      { name: 'Sarah Johnson - Bella', progress: Math.min((time + 30) / 120 * 100, 75) }
    ];

    homework.forEach((hw, idx) => {
      const y = contentY + idx * 90;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, contentX + 20, y, 300, 75, 6);
      ctx.stroke();
      ctx.fill();

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px -apple-system';
      ctx.fillText(hw.name, contentX + 35, y + 25);

      // Progress bar
      ctx.fillStyle = '#e5e7eb';
      drawRoundRect(ctx, contentX + 35, y + 35, 270, 12, 4);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      drawRoundRect(ctx, contentX + 35, y + 35, (hw.progress / 100) * 270, 12, 4);
      ctx.fill();

      ctx.fillStyle = '#6b7280';
      ctx.font = '11px -apple-system';
      ctx.fillText(`${Math.floor(hw.progress)}% Complete`, contentX + 35, y + 60);
    });
  }
}

function drawCalendarUI(ctx, x, y, time, drawRoundRect) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, x, y, 300, 200, 8);
  ctx.stroke();
  ctx.fill();

  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 12px -apple-system';
  ctx.fillText('November 2025', x + 15, y + 25);

  // Calendar grid
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days.forEach((day, idx) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px -apple-system';
    ctx.fillText(day, x + 20 + idx * 40, y + 50);
  });

  for (let i = 1; i <= 30; i++) {
    const col = (i + 2) % 7;
    const row = Math.floor((i + 2) / 7);
    const dayX = x + 20 + col * 40;
    const dayY = y + 65 + row * 25;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(dayX - 5, dayY - 12, 25, 20);

    if (i === 20) ctx.fillStyle = '#fbbf24';
    else ctx.fillStyle = '#1f2937';

    ctx.font = '11px -apple-system';
    ctx.fillText(i, dayX, dayY);
  }
}

function drawSessionForm(ctx, x, y, drawRoundRect) {
  ctx.fillStyle = '#dbeafe';
  drawRoundRect(ctx, x, y, 310, 220, 8);
  ctx.fill();

  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 14px -apple-system';
  ctx.fillText('New Training Session', x + 15, y + 25);

  ctx.fillStyle = '#374151';
  ctx.font = '11px -apple-system';
  const fields = [
    'Client: John Smith',
    'Pet: Max (Golden Retriever)',
    'Date: Nov 20, 2025 - 3:00 PM',
    'Duration: 60 minutes',
    'Location: Park Avenue'
  ];

  fields.forEach((field, idx) => {
    ctx.fillText(field, x + 15, y + 50 + idx * 25);
  });
}

function drawTextInput(ctx, x, y, width, height, placeholder) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#374151';
  ctx.font = '12px -apple-system';
  ctx.fillText(placeholder, x + 8, y + 18);
}

function drawCursor(ctx, x, y) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 10, y + 16);
  ctx.lineTo(x + 4, y + 16);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.fill();
}

function drawClickRipple(ctx, x, y, radius) {
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.globalAlpha = Math.max(0, 1 - radius / 60);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function TutorialVideoModal({ tutorialIndex, steps, guideTitle, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{guideTitle}</h2>
            <p className="text-sm text-gray-600">Interactive Animated Tutorial</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Animated Screen Recording */}
          <AnimatedTutorialScreen 
            step={step} 
            guideTitle={guideTitle}
            tutorialIndex={tutorialIndex}
            currentStep={currentStep}
            totalSteps={steps.length}
          />

          {/* Step Description Box */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6 mb-4">
            <h3 className="font-bold text-blue-900 mb-1">{step?.title}</h3>
            <p className="text-blue-800 text-sm">{step?.description}</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center items-center space-x-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-8 bg-blue-600'
                    : idx < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Fixed Navigation Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            ← Previous
          </Button>

          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>

          {currentStep === steps.length - 1 ? (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              ✓ Done
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- END HELP PAGE ---

// --- NEW: SCHEDULING PAGE ---

function SchedulingPage() {
  const { clients, pets, sessions } = useAppState();
  const dispatch = useAppDispatch();
  const [showNewSession, setShowNewSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateForNew, setSelectedDateForNew] = useState(null);

  const sessionsList = Object.values(sessions);
  const clientsList = Object.values(clients);
  const petsList = Object.values(pets);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionsForDate = (date) => {
    return sessionsList.filter(session => {
      const sessionDate = new Date(session.dateTime);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDateForNew(date);
    setShowNewSession(true);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
        <Button onClick={() => {
          setSelectedDateForNew(null);
          setShowNewSession(true);
        }} data-walkthrough="session-form">
          <Plus className="h-4 w-4 mr-2" /> New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="lg:col-span-2" data-walkthrough="calendar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{monthName}</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next →
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const daySession = getSessionsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square border rounded-lg p-2 text-sm cursor-pointer transition-colors ${
                    isToday 
                      ? 'bg-blue-100 border-blue-500 hover:bg-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-bold mb-1">{day}</div>
                  {daySession.length > 0 && (
                    <div className="space-y-1">
                      {daySession.map(session => (
                        <div
                          key={session.id}
                          className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 truncate cursor-pointer hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(session.id);
                          }}
                        >
                          {clients[session.clientId]?.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Sessions */}
        <Card data-walkthrough="share-session">
          <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessionsList
              .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
              .filter(s => new Date(s.dateTime) >= new Date())
              .slice(0, 5)
              .map(session => {
                const client = clients[session.clientId];
                const pet = pets[session.petId];
                const sessionDate = new Date(session.dateTime);

                return (
                  <div
                    key={session.id}
                    className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setEditingSessionId(session.id)}
                  >
                    <div className="font-semibold text-gray-800">{session.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="h-4 w-4" />
                        <span>{client?.name}</span>
                      </div>
                      {session.isShared && (
                        <div className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                          <Share2 className="h-3 w-3" />
                          <span>Shared with client</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* New/Edit Session Modal */}
      {(showNewSession || editingSessionId) && (
        <SessionFormModal
          sessionId={editingSessionId}
          selectedDate={selectedDateForNew}
          clients={clientsList}
          pets={petsList}
          onClose={() => {
            setShowNewSession(false);
            setEditingSessionId(null);
          }}
          dispatch={dispatch}
          sessions={sessions}
        />
      )}
    </div>
  );
}

function SessionFormModal({ sessionId, selectedDate, clients, pets, onClose, dispatch, sessions }) {
  const session = sessionId ? sessions[sessionId] : null;
  const defaultDateTime = selectedDate 
    ? selectedDate.toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);
  
  const [formData, setFormData] = useState({
    clientId: session?.clientId || '',
    petId: session?.petId || '',
    dateTime: session?.dateTime || defaultDateTime,
    duration: session?.duration || 60,
    location: session?.location || '',
    title: session?.title || '',
    notes: session?.notes || '',
    assignedTasks: session?.assignedTasks || []
  });

  const predefinedTasks = [
    'Practice "Sit" (5 mins, 2x daily)',
    'Practice "Stay" (10 mins)',
    'Loose leash walking practice (15 mins)',
    'Recall practice with treats (10 mins)',
    'Handling & grooming (5 mins)',
    'Crate games (10 mins)',
    'Socialization outing',
    'Desensitization walks'
  ];

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const clientPets = pets.filter(p => p.clientId === formData.clientId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionId) {
      dispatch({
        type: 'UPDATE_SESSION',
        payload: { sessionId, ...formData }
      });
    } else {
      dispatch({
        type: 'ADD_SESSION',
        payload: formData
      });
    }
    onClose();
  };

  const handleDeleteSession = () => {
    if (sessionId && window.confirm('Delete this session?')) {
      dispatch({ type: 'DELETE_SESSION', payload: { sessionId } });
      onClose();
    }
  };

  const handleShareSession = () => {
    if (sessionId) {
      dispatch({ type: 'SHARE_SESSION', payload: { sessionId } });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={sessionId ? 'Edit Session' : 'New Training Session'}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
        <Select
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value, petId: '' })}
          required
        >
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </Select>

        {clientPets.length > 0 && (
          <Select
            value={formData.petId}
            onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
          >
            <option value="">Select Pet (optional)</option>
            {clientPets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </Select>
        )}

        <Input
          type="text"
          placeholder="Session Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <Input
          type="datetime-local"
          value={formData.dateTime}
          onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
          required
        />

        <Select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
        >
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
        </Select>

        <Input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />

        <textarea
          placeholder="Session notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows="3"
          className="w-full p-2 border rounded-md"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Assign Tasks</label>
          <Select onChange={(e) => {
            if (e.target.value && !formData.assignedTasks.includes(e.target.value)) {
              setFormData({
                ...formData,
                assignedTasks: [...formData.assignedTasks, e.target.value]
              });
              e.target.value = '';
            }
          }}>
            <option value="">Add a task...</option>
            {predefinedTasks.filter(t => !formData.assignedTasks.includes(t)).map(task => (
              <option key={task} value={task}>{task}</option>
            ))}
          </Select>

          {formData.assignedTasks.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.assignedTasks.map((task, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm">{task}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      assignedTasks: formData.assignedTasks.filter((_, i) => i !== idx)
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1">
            <Check className="h-4 w-4 mr-2" /> {sessionId ? 'Update' : 'Create'}
          </Button>
          {sessionId && !sessions[sessionId]?.isShared && (
            <Button type="button" variant="outline" onClick={handleShareSession}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          )}
          {sessionId && (
            <Button type="button" variant="outline" onClick={handleDeleteSession} className="text-red-600">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

// --- END SCHEDULING PAGE ---

function TemplatesPage() {
  const { templates } = useAppState();
  const templateList = Object.values(templates);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Homework Templates</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card data-walkthrough="template-select">
          <h2 className="text-xl font-semibold mb-4">Create New Template</h2>
          <AddTemplateForm />
        </Card>
        
        {/* --- NEW SECTION --- */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Add from Template Library</h2>
          <p className="text-gray-600 mb-4">
            Add these out-of-the-box plans to your templates.
          </p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {STOCK_TEMPLATES.map(stockTemplate => (
              <StockTemplateCard
                key={stockTemplate.id}
                stockTemplate={stockTemplate}
              />
            ))}
          </div>
        </Card>
        {/* --- END NEW SECTION --- */}
        
        <div className="space-y-4 lg:col-span-2" data-walkthrough="task-list"> {/* Make user's list span full width */}
          <h2 className="text-xl font-semibold">Your Saved Templates</h2>
          {templateList.length > 0 ? templateList.map(template => (
            <Card key={template.id}>
              <h3 className="text-lg font-bold">{template.title}</h3>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                {template.tasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ul>
            </Card>
          )) : (
            <p>You haven't created any templates yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- NEW COMPONENT ---
function StockTemplateCard({ stockTemplate }) {
  const dispatch = useAppDispatch();
  const { templates } = useAppState();
  
  // Check if this template (by title) is already in the user's list
  const isAdded = Object.values(templates).some(
    t => t.title.toLowerCase() === stockTemplate.title.toLowerCase()
  );

  const handleAdd = () => {
    if (isAdded) return;
    
    dispatch({
      type: 'ADD_TEMPLATE',
      payload: { 
        title: stockTemplate.title, 
        tasks: stockTemplate.tasks 
      }
    });
  };

  return (
    <div className="border rounded-lg p-3 flex justify-between items-start">
      <div>
        <h4 className="font-semibold">{stockTemplate.title}</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
          {stockTemplate.tasks.map((task, i) => (
            <li key={i}>{task}</li>
          ))}
        </ul>
      </div>
      <Button
        variant={isAdded ? "ghost" : "outline"}
        onClick={handleAdd}
        disabled={isAdded}
        className="ml-2 shrink-0"
      >
        {isAdded ? (
          <>
            <Check className="h-4 w-4 mr-2" /> Added
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" /> Add
          </>
        )}
      </Button>
    </div>
  );
}
// --- END NEW COMPONENT ---


function AddTemplateForm() {
  const dispatch = useAppDispatch();
  const formRef = useRef(null);
  const [tasks, setTasks] = useState(['']); // Array of task description strings
  
  const handleTaskChange = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };
  
  const handleAddTask = () => {
    setTasks([...tasks, '']);
  };

  const handleRemoveTask = (index) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const nonEmptyTasks = tasks.filter(t => t.trim() !== '');
    
    dispatch({
      type: 'ADD_TEMPLATE',
      payload: { title, tasks: nonEmptyTasks }
    });
    
    formRef.current.reset();
    setTasks(['']);
  };
  
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Input name="title" placeholder="Template Title" required />
      
      <div>
        <label className="block text-sm font-medium mb-1">Tasks</label>
        {tasks.map((task, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <Input
              placeholder={`Task ${index + 1}`}
              value={task}
              onChange={(e) => handleTaskChange(index, e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => handleRemoveTask(index)} className="text-red-500">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={handleAddTask}>
          + Add Task
        </Button>
      </div>
      
      <Button type="submit" className="w-full">
        Save Template
      </Button>
    </form>
  );
}

// --- 7. REUSABLE UI COMPONENTS (THE FIX) ---

// We define the base styles for our components here
const baseButtonClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-4 py-2";

const buttonVariants = {
  solid: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-gray-300 bg-white hover:bg-gray-50",
  ghost: "hover:bg-gray-100",
};

// Button Component
function Button({ variant = 'solid', className = '', ...props }) {
  return (
    <button
      className={`${baseButtonClasses} ${buttonVariants[variant] || buttonVariants.solid} ${className}`}
      {...props}
    />
  );
}

// Card Component
function Card({ className = '', ...props }) {
  return (
    <div
      className={`bg-white shadow-sm rounded-lg p-6 ${className}`}
      {...props}
    />
  );
}

// Input Component
function Input({ className = '', ...props }) {
  return (
    <input
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  );
}

// Select Component
function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

// --- 8. PAGE COMPONENT (Client-Facing) ---

function ClientPortalPage({ homeworkId }) {
  const { homeworks, clients, tasks } = useAppState();
  const { toDashboard } = useNavigation();
  
  const homework = homeworks[homeworkId];
  if (!homework) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Homework Not Found</h1>
        <p>This homework plan could not be found.</p>
        <Button onClick={toDashboard} className="mt-6">&larr; Back to App</Button>
      </div>
    );
  }
  
  const client = clients[homework.clientId];
  const homeworkTasks = Object.values(tasks).filter(t => t.homeworkId === homeworkId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Dog className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">
            {homework.title}
          </h1>
          <p className="text-lg text-gray-600">
            Homework for {client?.name || 'your dog'}
          </p>
        </div>

        {/* The Interactive Checklist */}
        <ClientChecklist tasks={homeworkTasks} />

        <p className="text-center text-gray-500 mt-8">
          Your trainer's dashboard is updated automatically.
        </p>
        
        {/* This is a "backdoor" for the trainer to get back to their app */}
        <div className="text-center mt-4">
          <Button variant="ghost" onClick={toDashboard}>
            &larr; Back to Trainer Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClientChecklist({ tasks }) {
  const dispatch = useAppDispatch();
  
  const handleToggle = (taskId) => {
    dispatch({ type: 'TOGGLE_TASK', payload: { taskId } });
  };
  
  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <p className="text-center text-gray-600">No tasks for this plan.</p>
      )}
      {tasks.map(task => (
        <label
          key={task.id}
          className={`flex items-center p-4 border rounded-lg transition-all cursor-pointer ${
            task.isComplete
              ? 'bg-green-50 border-green-200'
              : 'bg-white shadow-sm'
          }`}
        >
          <input
            type="checkbox"
            checked={task.isComplete}
            onChange={() => handleToggle(task.id)}
            className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span
            className={`ml-3 text-lg ${
              task.isComplete ? 'text-gray-500 line-through' : 'text-gray-800'
            }`}
          >
            {task.description}
          </span>
        </label>
      ))}
    </div>
  );
}
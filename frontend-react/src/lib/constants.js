// Ported verbatim from production public/index.html. Do not "improve" values here —
// they must match what is stored in the database and shown in production.

export const LEAD_STAGES = ['New','Contacted','Pre Qualified','Qualified','Not Qualified','Junk Lead','Proposal Sent','Negotiation','Follow Up','Won','Lost','Lost Lead']
export const DEAL_STAGES = ['Offered','Joined','Absconded','Declined']
// Stages that count as "won" for revenue calculations
export const WON_STAGES = new Set(['Joined','Won','Closed Won','Placed'])
// Stages that count as "lost"
export const LOST_STAGES = new Set(['Absconded','Declined','Lost','Closed Lost'])
export const isWon = (d) => WON_STAGES.has(d.stage)
export const isLost = (d) => LOST_STAGES.has(d.stage)
export const isActive = (d) => !isWon(d) && !isLost(d)

export const BADGE_MAP = {
  'Active':'badge-green','Prospect':'badge-blue','Inactive':'badge-gray',
  'Won':'badge-green','Lost':'badge-red','New':'badge-blue','Contacted':'badge-amber',
  'Qualified':'badge-purple','Proposal Sent':'badge-amber','Negotiation':'badge-amber',
  'Sourced':'badge-gray','Submitted':'badge-blue','L1 Interview':'badge-purple',
  'L2 Interview':'badge-purple','L3 Interview':'badge-purple',
  'Offer':'badge-amber','Joined':'badge-green','Dropped':'badge-red',
  'Open':'badge-green','On Hold':'badge-amber','Closed':'badge-gray','Filled':'badge-blue',
  'Pending':'badge-amber','Paid':'badge-green','Overdue':'badge-red',
  'Scheduled':'badge-blue','Completed':'badge-green','Cancelled':'badge-red','No Show':'badge-red',
  'Extended':'badge-amber','Declined':'badge-red','Accepted':'badge-green',
  'Done':'badge-green','In Progress':'badge-blue'
}

export const PAGE_TITLES = {
  dashboard:'Home', leads:'Leads', 'my-day':'Workqueue', reports:'Analytics',
  calendar:'Calendar', contacts:'Contacts', companies:'Accounts', deals:'Deals',
  documents:'Documents', commercial:'Invoices', tasks:'Tasks', activities:'Calls & Meetings',
  team:'Team', audit:'Audit Log', setup:'Setup', 'personal-settings':'Personal Settings',
  'business-onboarded':'Business Onboarded'
}

export const PAGE_SIZE = 25

export const DOC_CATEGORIES_DEFAULT = ['MSA (Master Service Agreement)','NDA (Non-Disclosure Agreement)','Service Agreement','Client Contracts','Invoices','Purchase Orders','Company Documents','Other Documents']

// Module access permissions per role (production ROLE_PERMS)
export const ROLE_PERMS = {
  'Super Admin': { leads:['view','create','edit','delete'], contacts:['view','create','edit','delete'], accounts:['view','create','edit','delete'], deals:['view','create','edit','delete'], reports:['view','create','edit','delete'], documents:['view','create','edit','delete'], activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:['view','manage'] },
  'Admin':       { leads:['view','create','edit','delete'], contacts:['view','create','edit','delete'], accounts:['view','create','edit','delete'], deals:['view','create','edit','delete'], reports:['view','create'],                  documents:['view','create','edit','delete'], activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:['view'] },
  'Manager':     { leads:['view','create','edit'],          contacts:['view','create','edit'],          accounts:['view','create','edit'],          deals:['view','create','edit'],          reports:['view'],                           documents:['view','create','edit'],          activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:[] },
  'User':        { leads:['view','create'],                 contacts:['view','create'],                 accounts:['view'],                          deals:['view','create'],                 reports:['view'],                           documents:['view','create'],                 activities:['view','create','edit','delete'], tasks:['view','create','edit','delete'], setup:[] },
  'Restricted':  { leads:['view'],                         contacts:[],                                accounts:[],                                deals:[],                                reports:[],                                 documents:['view'],                          activities:['view'],                         tasks:['view'],                          setup:[] }
}

// Section keys used for "new since last visit" nav badges (production updateNavBadges)
export const BADGE_SECTIONS = {
  leads: 'leads', contacts: 'contacts', companies: 'companies', deals: 'deals',
  tasks: 'tasks', activities: 'activities', documents: 'documents',
  businessOnboarded: 'business-onboarded',
}

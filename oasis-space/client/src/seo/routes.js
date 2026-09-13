import { SITE_URL, SITE_NAME, SITE_TAGLINE, DEFAULT_DESCRIPTION, fullTitle } from './site';

const pageRoutes = {
  '/': {
    title: SITE_TAGLINE,
    description: DEFAULT_DESCRIPTION,
  },
  '/search': {
    title: 'Search Homes, Apartments & Villas With Filters | OasisSpace',
    description:
      'Search buy and rent properties across India. Filter by city, price, bedrooms and more. Free to browse — rent listings publish free, verified sellers only.',
  },
  '/about': {
    title: 'About OasisSpace — Our Mission, Fees & Founder',
    description:
      'OasisSpace is an AI-powered real estate marketplace built by Shivam Singh. Rent listings publish free; Sale listings carry a one-time \u20B95,100 listing fee that keeps OasisSpace genuine.',
  },
  '/privacy': {
    title: 'Privacy Policy | OasisSpace',
    description: 'How OasisSpace collects, uses and protects your personal data, payments and saved properties.',
  },
  '/terms': {
    title: 'Terms of Service | OasisSpace',
    description: 'The terms that govern your use of OasisSpace — listing fees, seller verification, bookings and cancellations.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | OasisSpace',
    description:
      'Answers on how to list a property (rent listings publish free, \u20B95,100 one-time for sale), how the AI assistant works, editing listings and contacting support.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I list my property on OasisSpace?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Register and become a verified seller, go to your profile, click 'List a Property', fill in the details and upload photos. Rent listings publish instantly for free; Sale listings go live immediately after paying the one-time fee.",
            },
          },
          {
            '@type': 'Question',
            name: 'Is it free to browse properties?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Searching, viewing details, using the interactive map and contacting landlords is completely free for buyers and tenants.',
            },
          },
          {
            '@type': 'Question',
            name: 'What are the charges for listing a property?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rent listings publish completely free and go live instantly. For Sale listings we charge a one-time fee of \u20B95,100 via Razorpay. This ensures only genuine owners list on the platform.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the AI Assistant work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Our AI assistant 'Jarvis' helps you find properties by chatting. Ask things like 'Show me 2BHK in Mumbai under \u20B920k' and it fetches real-time data from our database.",
            },
          },
          {
            '@type': 'Question',
            name: 'Can I edit my listing after posting?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Go to your profile > My Properties and click Edit to update the price, photos or description anytime.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I contact support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Email us at oasisspace60@gmail.com or use the contact form in the website footer.',
            },
          },
        ],
      },
    ],
  },
};

const privatePages = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/profile',
  '/saved-listings',
  '/create-listing',
  '/seller-dashboard',
  '/dashboard',
  '/order-history',
  '/settings',
];

const LISTING_DEFAULT = {
  title: 'Property Details — Buy & Rent | OasisSpace',
  description:
    'View verified property details, photos, live map location, EMI calculator and contact the landlord directly on OasisSpace.',
};

function canonicalPath(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return `${SITE_URL}${clean}`;
}

export function routeFor(pathname) {
  const path = pathname || '/';

  if (path.startsWith('/listing/')) return { config: LISTING_DEFAULT, noindex: false };
  if (path.startsWith('/update-listing/') || privatePages.includes(path)) {
    return { config: { title: 'OasisSpace' }, noindex: true };
  }

  return { config: pageRoutes[path] || pageRoutes['/'], noindex: false };
}

export { pageRoutes as seoRoutes, privatePages as seoPrivatePages, SITE_NAME, fullTitle, canonicalPath };
import { LeadershipMember, Event, Club, EventStatus, ExternalEvent, EventCategory, NewsArticle, Application, User, AnnualEvent, Notification } from './types';

export const LEADERSHIP: LeadershipMember[] = [
  {
    id: 1,
    name: 'Mr. G. R. Ravinder Reddy',
    title: 'Chairman',
    imageUrl: 'https://gcet.edu.in/images/chairman.jpg',
    quote: 'We are dedicated to aligning our curriculum with the future needs of the industry.',
  },
  {
    id: 2,
    name: 'R. Harishchandra Reddy',
    title: 'Vice chairman',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkw_JxAi5zipbO-n_L_OfSNFmUTaWpnSZ9rg&s',
    quote: 'A vibrant campus life is crucial for holistic development and creating lasting memories.',
  },
  {
    id: 3,
    name: 'Dr.Udaya Kumar Susarla',
    title: 'Director',
    imageUrl: 'https://gcet.edu.in/images/principal.jpg',
    quote: 'Our commitment is to ensure the highest standards of education and student success are met.',
  },
  {
    id: 4,
    name: 'Dr. K. Sagar',
    title: 'Principal',
    imageUrl: 'https://gcet.edu.in/images/Principal_Sagar.jpg',
    quote: 'Fostering an environment of innovation and excellence for all students is my highest priority.',
  },
];

export const EVENTS: Event[] = [
  {
    id: 'ev101',
    name: 'Annual Tech Symposium 2024',
    date: 'October 26, 2024',
    time: '9:00 AM - 5:00 PM',
    location: 'Main Auditorium',
    description: 'A full day of talks and workshops from industry l`eaders on the future of technology, AI, and software development.',
    rules: ["All attendees must register online.", "Bring a valid college ID for entry.", "Sessions are on a first-come, first-served basis."],
    imageUrl: 'https://picsum.photos/seed/techsymposium/800/400',
    status: EventStatus.Upcoming,
    category: 'Technical',
    isFeatured: true,
    registrationFee: 0,
    organizerClubId: 'coding',
    coordinators: [{name: 'Nithin Kumar', contact: 'nithin.k@college.edu'}],
    capacity: 200,
  },
  {
    id: 'ev102',
    name: 'Robotics Design Challenge',
    date: 'November 5, 2024',
    time: '10:00 AM - 4:00 PM',
    location: 'Engineering Block, Lab 5',
    description: 'Build and battle robots in our annual design challenge. Prizes for the most innovative and effective designs. Open to all students.',
    rules: ["Teams can have 2-4 members.", "All materials will be provided.", "Judging criteria will be shared at the event start."],
    imageUrl: 'https://picsum.photos/seed/roboticschallenge/800/400',
    status: EventStatus.Upcoming,
    category: 'Technical',
    isFeatured: true,
    registrationFee: 10,
    organizerClubId: 'robotics',
    coordinators: [{name: 'Sankeerth Reddy', contact: 'sankeerth.r@college.edu'}]
  },
  {
    id: 'ev103',
    name: 'AI & Machine Learning Summit',
    date: 'September 15-20, 2024',
    time: 'Ongoing This Week',
    location: 'Virtual Event',
    description: 'A week-long series of virtual keynotes and panel discussions on the latest trends in AI and Machine Learning.',
    rules: ["Register to receive the streaming links.", "Q&A will be held after each session via chat."],
    imageUrl: 'https://picsum.photos/seed/aisummit/800/400',
    status: EventStatus.Ongoing,
    category: 'Workshop',
    organizerClubId: 'aiml',
    coordinators: [{name: 'Panda Sai', contact: 'panda.s@college.edu'}]
  },
   {
    id: 'ev104',
    name: 'Culturals Night 2024',
    date: 'November 15, 2024',
    time: '6:00 PM onwards',
    location: 'College Amphitheatre',
    description: 'An evening of music, dance, and drama performances by our talented students. A celebration of art and culture.',
    rules: ["Entry is free for all students and faculty.", "Seating is limited."],
    imageUrl: 'https://picsum.photos/seed/culturals/800/400',
    status: EventStatus.Upcoming,
    category: 'Cultural',
    isFeatured: true,
    registrationFee: 0,
    organizerClubId: 'cultural',
    coordinators: [{name: 'Puneeth Varma', contact: 'puneeth.v@college.edu'}]
  },
  {
    id: 'bhaswara_cs_codeathon',
    name: "Code-a-Thon (Bhaswara '24)",
    date: 'December 5, 2024',
    time: '9:00 AM - 5:00 PM',
    location: 'CS Department Labs',
    description: 'A flagship event of Bhaswara, the annual tech fest. A day-long coding competition organized by the CS department.',
    rules: ["Team of 2-4 members.", "Problem statements will be revealed on the spot."],
    imageUrl: 'https://picsum.photos/seed/bhaswaracode/800/400',
    status: EventStatus.Upcoming,
    category: 'Technical',
    organizerClubId: 'coding',
    coordinators: [{name: 'Pavan Bejawada', contact: 'pavan.b@college.edu'}],
    parentAnnualEventId: 'bhaswara',
    registrationFee: 5,
  },
  {
    id: 'bhaswara_mech_robowars',
    name: "RoboWars (Bhaswara '24)",
    date: 'December 6, 2024',
    time: '10:00 AM - 4:00 PM',
    location: 'Mechanical Workshop',
    description: 'As part of Bhaswara, witness metal titans clash in the ultimate robotic combat.',
    rules: ["Weight limits apply.", "Safety regulations must be followed."],
    imageUrl: 'https://picsum.photos/seed/bhaswararobo/800/400',
    status: EventStatus.Upcoming,
    category: 'Technical',
    organizerClubId: 'robotics',
    coordinators: [{name: 'Paramesh K', contact: 'paramesh.k@college.edu'}],
    parentAnnualEventId: 'bhaswara',
    registrationFee: 10,
  },
  {
    id: 'bhaswara_nontech_scary',
    name: "The Haunted Lab (Bhaswara '24)",
    date: 'December 5-6, 2024',
    time: '11:00 AM - 5:00 PM',
    location: 'Old Physics Lab',
    description: 'Experience thrills and chills in this non-technical scary house event, a popular attraction at Bhaswara.',
    rules: ["Enter at your own risk.", "Not for the faint of heart."],
    imageUrl: 'https://picsum.photos/seed/bhaswarascary/800/400',
    status: EventStatus.Upcoming,
    category: 'Cultural',
    organizerClubId: 'cultural',
    coordinators: [{name: 'Nithin Kumar', contact: 'nithin.k@college.edu'}],
    parentAnnualEventId: 'bhaswara',
    registrationFee: 2,
  },
  {
    id: 'ev201',
    name: 'CodeFest 2023',
    date: 'May 12, 2023',
    time: 'All Day',
    location: 'Computer Labs 1-5',
    description: 'A competitive programming event where students solved algorithmic challenges. The event saw over 200 participants.',
    rules: [],
    imageUrl: 'https://picsum.photos/seed/codefest/800/400',
    status: EventStatus.Past,
    category: 'Technical',
    organizerClubId: 'coding',
    coordinators: [],
    highlights: {
        images: [
            'https://picsum.photos/seed/codefest-gallery1/600/400',
            'https://picsum.photos/seed/codefest-gallery2/600/400',
            'https://picsum.photos/seed/codefest-gallery3/600/400',
        ],
        guests: ['Dr. Alan Turing (Keynote Speaker)', 'Ms. Grace Hopper (Judge)'],
        winners: [
            { position: '1st Place', name: 'Team Alpha', details: 'Solved all problems in record time.' },
            { position: '2nd Place', name: 'Team Binary Brigade', details: 'Impressive performance with complex algorithms.' },
            { position: '3rd Place', name: 'Team Code Wizards', details: 'Strong showing from first-year students.' }
        ],
        galleryDriveLink: 'https://photos.app.goo.gl/ex4o52pLp3NEaK9C9',
    }
  },
  {
    id: 'ev202',
    name: 'Intro to Drone Building',
    date: 'April 20, 2023',
    time: '1:00 PM - 5:00 PM',
    location: 'Robotics Lab',
    description: 'A hands-on workshop teaching the fundamentals of drone mechanics and assembly.',
    rules: [],
    imageUrl: 'https://picsum.photos/seed/droneworkshop/800/400',
    status: EventStatus.Past,
    category: 'Workshop',
    organizerClubId: 'coding',
    coordinators: []
  },
  {
    id: 'ev203',
    name: 'Guest Lecture: The Ethics of AI',
    date: 'March 5, 2023',
    time: '4:00 PM',
    location: 'Seminar Hall B',
    description: 'The AI/ML Club hosted a thought-provoking lecture by a leading AI ethicist on the societal impact of intelligent systems.',
    rules: [],
    imageUrl: 'https://picsum.photos/seed/aiethics/800/400',
    status: EventStatus.Past,
    category: 'Technical',
    organizerClubId: 'aiml',
    coordinators: [],
    highlights: {
        images: [
            'https://picsum.photos/seed/aiethics-gallery1/600/400',
            'https://picsum.photos/seed/aiethics-gallery2/600/400',
        ],
        guests: ['Dr. Evelyn Reed (AI Ethicist)'],
        winners: [],
        galleryDriveLink: 'https://photos.app.goo.gl/ex4o52pLp3NEaK9C9',
    }
  },
];

export const CLUBS: Club[] = [
  {
    id: 'robotics',
    name: 'Robotics Club',
    tagline: 'Building the future, one robot at a time.',
    description: 'Dedicated to the design, construction, and operation of robots. We participate in national competitions and host workshops to spread the passion for automation and mechatronics.',
    logoUrl: 'https://picsum.photos/seed/roboticslogo/200/200',
    bannerUrl: 'https://picsum.photos/seed/roboticsbanner/1200/400',
    eventIds: ['ev102', 'ev202'],
    achievements: [
        'Winners at National Robotics Championship 2023',
        'Hosted a state-level workshop on drone technology',
        'Developed a rover for the Smart India Hackathon'
    ],
    team: [
        { id: 't_pk', name: 'Paramesh K', position: 'President', imageUrl: 'https://picsum.photos/seed/paramesh/200/200' },
        { id: 't_sr', name: 'Sankeerth Reddy', position: 'Vice President', imageUrl: 'https://picsum.photos/seed/sankeerth/200/200' },
        { id: 't_pv', name: 'Puneeth Varma', position: 'Technical Head', imageUrl: 'https://picsum.photos/seed/puneeth/200/200' },
        { id: 't_nk', name: 'Nithin Kumar', position: 'Events Lead', imageUrl: 'https://picsum.photos/seed/nithin/200/200' },
        { id: 't_sk', name: 'Sam Kumar', position: 'Member' },
        { id: 't_ps', name: 'Panda Sai', position: 'Member' },
        { id: 't_cw', name: 'Chris Wood', position: 'Volunteer' },
        { id: 't_em', name: 'Emily Clark', position: 'Volunteer' },
    ],
    recruitmentOpen: false,
    recruitmentQuestions: [
        "Describe a project you've worked on that you are proud of.",
        "What is your experience with programming languages like C++ or Python?",
        "How would you contribute to the club's goals?",
    ]
  },
  {
    id: 'coding',
    name: 'The Coding Hub',
    tagline: 'Code, Compete, Conquer.',
    description: 'A community for passionate programmers. We organize coding contests, hackathons, and workshops on various technologies like web development, app development, and competitive programming.',
    logoUrl: 'https://picsum.photos/seed/codinglogo/200/200',
    bannerUrl: 'https://picsum.photos/seed/codingbanner/1200/400',
    eventIds: ['ev101', 'ev201'],
    achievements: [
        'Top 10 in Google Code Jam - India region',
        'Winners of Inter-College CodeFest for 3 consecutive years',
        'Published a popular open-source library for data structures'
    ],
    team: [
        { id: 't_pb', name: 'Pavan Bejawada', position: 'President', imageUrl: 'https://picsum.photos/seed/pavanb/200/200' },
        { id: 't_pk2', name: 'Paramesh K', position: 'Competitive Programming Head', imageUrl: 'https://picsum.photos/seed/parameshk/200/200' },
    ],
    recruitmentOpen: true,
    recruitmentQuestions: [
        "What is your preferred programming language and why?",
        "Share a link to your GitHub or competitive programming profile.",
        "What are you hoping to learn by joining The Coding Hub?",
    ]
  },
  {
    id: 'aiml',
    name: 'AI/ML Enthusiasts',
    tagline: 'Exploring the frontiers of intelligence.',
    description: 'This club is for students fascinated by Artificial Intelligence and Machine Learning. We explore everything from neural networks to natural language processing through projects and study groups.',
    logoUrl: 'https://picsum.photos/seed/aimllogo/200/200',
    bannerUrl: 'https://picsum.photos/seed/aimlbanner/1200/400',
    eventIds: ['ev103', 'ev203'],
    achievements: [
        "Published a research paper on sentiment analysis in a reputed journal",
        "Developed a predictive model for campus placements with 90% accuracy",
    ],
    team: [
        { id: 't_pb2', name: 'Pavan Bejawada', position: 'President', imageUrl: 'https://picsum.photos/seed/pavan/200/200' },
        { id: 't_sr2', name: 'Sankeerth Reddy', position: 'Research Lead', imageUrl: 'https://picsum.photos/seed/sankeerthreddy/200/200' },
    ],
    recruitmentOpen: false,
  },
  {
    id: 'cultural',
    name: 'Cultural Club',
    tagline: 'Celebrating diversity and creativity.',
    description: 'The heart of arts and culture on campus. We organize events that celebrate music, dance, drama, and fine arts, fostering a vibrant and inclusive cultural environment for all students.',
    logoUrl: 'https://picsum.photos/seed/culturallogo/200/200',
    bannerUrl: 'https://picsum.photos/seed/culturalbanner/1200/400',
    eventIds: ['ev104'],
    achievements: [
        "Won 'Best Cultural Fest' at the national university awards",
        "Organized a charity concert that raised over $5000 for local artists",
    ],
    team: [
        { id: 't_nk2', name: 'Nithin Kumar', position: 'President', imageUrl: 'https://picsum.photos/seed/nithin/200/200' },
        { id: 't_pv2', name: 'Puneeth Varma', position: 'Music Coordinator', imageUrl: 'https://picsum.photos/seed/puneethvarma/200/200' },
    ],
    recruitmentOpen: true,
    recruitmentQuestions: [
        "Which art form are you most passionate about and why?",
        "Do you have any prior experience in organizing cultural events?",
        "How can you contribute to the club's activities?",
    ]
  }
];

export const EXTERNAL_EVENTS: ExternalEvent[] = [
    {
        id: 'ext1',
        name: 'InnovateIndia Hackathon 2024',
        organizer: 'Tech giant Corp & Govt. of India',
        description: 'A 48-hour national level hackathon focused on solving real-world problems in healthcare, education, and finance.',
        link: '#',
        category: 'Hackathon',
    },
    {
        id: 'ext2',
        name: 'TechKriti 2024',
        organizer: 'IIT Kanpur',
        description: 'One of the largest technical festivals in Asia, featuring workshops, competitions, and talks from Nobel laureates.',
        link: '#',
        category: 'Tech Fest',
    },
    {
        id: 'ext3',
        name: 'Summer Internship Program',
        organizer: 'FutureSoft Inc.',
        description: 'A 2-month paid internship for software development roles. Open to pre-final year students.',
        link: '#',
        category: 'Internship',
    }
];

export const NEWS: NewsArticle[] = [
    {
        id: 'news1',
        title: 'Recruitment Drive for The Coding Hub is Now Open!',
        date: 'September 1, 2024',
        summary: 'The Coding Hub is looking for passionate coders to join their team. All students are welcome to apply and showcase their skills.',
        category: 'Recruitment',
        link: {
            path: '/clubs/coding',
            text: 'View Club & Apply'
        }
    },
    {
        id: 'news2',
        title: 'Team Alpha Wins CodeFest 2023',
        date: 'May 15, 2023',
        summary: 'Congratulations to Team Alpha for securing the first position in the annual CodeFest competition. Their exceptional problem-solving skills led them to victory.',
        category: 'Event Result',
        link: {
            path: '/events/ev201',
            text: 'See Event Highlights'
        }
    },
    {
        id: 'news3',
        title: 'Upcoming: Annual Tech Symposium 2024',
        date: 'August 25, 2024',
        summary: 'Mark your calendars for the biggest technical event of the year. The Annual Tech Symposium will feature talks from industry leaders, hands-on workshops, and more.',
        category: 'Announcement',
        link: {
            path: '/events/ev101',
            text: 'Learn More'
        }
    }
];

export const APPLICATIONS: Application[] = [
  {
    id: 'app101',
    userName: 'Sankeerth Reddy',
    userImageUrl: 'https://picsum.photos/seed/sankeerth/200/200',
    userEmail: 'sankeerth.r@college.edu',
    userYear: '2nd Year',
    userBranch: 'CS',
    userMobile: '555-0101',
    clubId: 'coding',
    status: 'pending',
    answers: [
        { question: 'Why do you want to join?', answer: 'I love coding and want to learn more.' },
        { question: 'What is your experience?', answer: 'I have worked on a few personal projects using Python and JavaScript.' }
    ]
  },
  {
    id: 'app102',
    userName: 'Panda Sai',
    userImageUrl: 'https://picsum.photos/seed/panda/200/200',
    userEmail: 'panda.s@college.edu',
    userYear: '3rd Year',
    userBranch: 'ME',
    userMobile: '555-0102',
    clubId: 'robotics',
    status: 'pending',
    answers: [
        { question: 'Why robotics?', answer: 'I am fascinated by automation and want to build cool things.' }
    ]
  },
  {
    id: 'app103',
    userName: 'Puneeth Varma',
    userImageUrl: 'https://picsum.photos/seed/puneeth/200/200',
    userEmail: 'puneeth.v@college.edu',
    userYear: '1st Year',
    userBranch: 'ECE',
    userMobile: '555-0103',
    clubId: 'coding',
    status: 'pending',
    answers: [
        { question: 'Why do you want to join?', answer: 'I am new to coding and eager to learn from seniors.' },
        { question: 'What is your experience?', answer: 'I have some basic knowledge of C programming.' }
    ]
  },
  {
    id: 'app104',
    userName: 'Pavan Kumar',
    userImageUrl: 'https://picsum.photos/seed/pavankumar/200/200',
    userEmail: 'pavan.k@college.edu',
    userYear: '4th Year',
    userBranch: 'IT',
    userMobile: '555-0104',
    clubId: 'robotics',
    status: 'accepted',
    answers: [
        { question: 'Why robotics?', answer: 'I want to apply my IT skills to a robotics project for my final year.' }
    ]
  },
  {
    id: 'app105',
    userName: 'Dev Contributor',
    userImageUrl: `https://picsum.photos/seed/Dev Contributor/200/200`,
    userEmail: 'dev@college.edu',
    userYear: '3rd Year',
    userBranch: 'CS',
    userMobile: '555-0106',
    clubId: 'cultural', // a club they DON'T manage
    status: 'accepted',
    answers: [
        { question: 'Why do you want to join?', answer: 'I am passionate about cultural activities.' }
    ]
  }
];

export const MOCK_USERS: User[] = [
  { id: 'usr_001', name: 'Sankeerth Reddy', rollNumber: '21CS101', role: 'student', email: 'sankeerth.r@college.edu', year: '3rd Year', branch: 'CSE', mobile: '555-0101' },
  { id: 'usr_002', name: 'Panda Sai', rollNumber: '22EC205', role: 'student', email: 'panda.s@college.edu', year: '2nd Year', branch: 'ECE', mobile: '555-0102' },
  { id: 'usr_003', name: 'Puneeth Varma', rollNumber: '20ME310', role: 'student', email: 'puneeth.v@college.edu', year: '4th Year', branch: 'ME', mobile: '555-0103' },
  { id: 'usr_004', name: 'Pavan Kumar', rollNumber: '23IT415', role: 'student', email: 'pavan_stu@gmail.com', year: '1st Year', branch: 'IT', mobile: '555-0104' },
  { 
    id: 'usr_c01', 
    name: 'Pavan Bejawada', 
    rollNumber: '21CS050', 
    role: 'contributor', 
    managedClubIds: ['coding', 'aiml'],
    email: 'pavan@gmail.com',
    year: '3rd Year', branch: 'CSE', mobile: '555-0105'
  },
  { 
    id: 'usr_c02', 
    name: 'Paramesh K', 
    rollNumber: '22ME110', 
    role: 'contributor', 
    managedClubIds: ['robotics'],
    email: 'paramesh.k@college.edu',
    year: '2nd Year', branch: 'ME', mobile: '555-0106'
  },
  { 
    id: 'usr_c03', 
    name: 'Nithin Kumar', 
    rollNumber: '21AR025', 
    role: 'contributor', 
    managedClubIds: ['cultural'],
    email: 'nithin.k@college.edu',
    year: '3rd Year', branch: 'ARCH', mobile: '555-0107'
  },
  { 
    id: 'usr_a01', 
    name: 'Dev Admin', 
    role: 'admin',
    email: 'admin@gmail.com'
  }
];

export const NOTIFICATIONS: Notification[] = [
  // Notifications for Sankeerth Reddy (usr_001)
  {
    id: 'notif1',
    userId: 'usr_001',
    type: 'application-rejected',
    message: "Your application to The Coding Hub was not accepted at this time.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    link: '/clubs/coding'
  },
  {
    id: 'notif2',
    userId: 'usr_001',
    type: 'info',
    message: "A new event 'Robotics Design Challenge' has been announced by a club you're in.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    link: '/events/ev102'
  },

  // Notifications for Pavan Bejawada (usr_c01)
  {
    id: 'notif3',
    userId: 'usr_c01',
    type: 'access-granted',
    message: "You have been granted admin access for the AI/ML Enthusiasts club.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    isRead: false,
    link: '/clubs/aiml'
  },
  {
    id: 'notif4',
    userId: 'usr_c01',
    type: 'event-winner',
    message: "Congratulations! Your team won 2nd Place in CodeFest 2023.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
    link: '/events/ev201'
  },

  // Notification for Paramesh K (usr_c02)
   {
    id: 'notif5',
    userId: 'usr_c02',
    type: 'access-revoked',
    message: "Your admin access for the Robotics Club has been revoked by the super admin.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    isRead: false,
    link: '/clubs/robotics'
  },
   // Notification for Nithin Kumar (usr_c03)
   {
    id: 'notif6',
    userId: 'usr_c03',
    type: 'application-accepted',
    message: "Your application to the Cultural Club has been accepted. Welcome aboard!",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isRead: false,
    link: '/clubs/cultural'
  }
];


export const ANNUAL_EVENTS: AnnualEvent[] = [
  {
    id: 'vibgyor',
    name: 'Vibgyor - The Star Night',
    category: 'Cultural',
    shortDescription: 'The most awaited cultural extravaganza of the year, featuring celebrity concerts, DJ nights, and stunning student performances.',
    longDescription: 'Vibgyor is the soul of our campus culture. It is a spectacular of music, dance, and art that brings together the entire college community. Day 1 is traditionally a high-energy concert night headlined by a popular singer from the industry, followed by electrifying sets from international DJs. Vibgyor is more than an event; it\'s a celebration of our collective spirit and creativity.',
    bannerUrl: 'https://picsum.photos/seed/vibgyorbanner/1600/600',
    registrationEnabled: false,
    yearlyData: [
      {
        year: 2023,
        theme: 'Retro Rewind',
        chiefGuests: [
          {
            name: 'Sonu Nigam',
            title: 'Legendary Playback Singer',
            profileImageUrl: 'https://picsum.photos/seed/sonunigam/200/200',
            eventPhotos: [
              'https://picsum.photos/seed/sonu-event1/600/400',
              'https://picsum.photos/seed/sonu-event2/600/400',
              'https://picsum.photos/seed/sonu-event3/600/400'
            ]
          },
          {
            name: 'DJ Snake',
            title: 'International Music Producer',
            profileImageUrl: 'https://picsum.photos/seed/djsnake/200/200',
            eventPhotos: [
              'https://picsum.photos/seed/snake-event1/600/400',
              'https://picsum.photos/seed/snake-event2/600/400',
              'https://picsum.photos/seed/snake-event3/600/400'
            ]
          }
        ],
        highlightsGallery: {
          previewImages: [
            'https://picsum.photos/seed/vibgyor23-1/600/400',
            'https://picsum.photos/seed/vibgyor23-2/600/400',
            'https://picsum.photos/seed/vibgyor23-3/600/400',
            'https://picsum.photos/seed/vibgyor23-4/600/400',
          ],
          fullGalleryLink: 'https://photos.app.goo.gl/ex4o52pLp3NEaK9C9',
        },
        organizingTeam: [
          { name: 'Nithin Kumar', position: 'Overall Coordinator', imageUrl: 'https://picsum.photos/seed/nithin/200/200' },
          { name: 'Puneeth Varma', position: 'Student Head', imageUrl: 'https://picsum.photos/seed/puneethvarma/200/200' },
          { name: 'John Doe', position: 'Logistics Head'},
          { name: 'Jane Smith', position: 'Marketing Lead'},
          { name: 'Sam Wilson', position: 'Volunteer Coordinator'},
        ],
      },
       {
        year: 2022,
        theme: 'Cosmic Carnival',
        chiefGuests: [
          {
            name: 'Shreya Ghoshal',
            title: 'Melody Queen',
            profileImageUrl: 'https://picsum.photos/seed/shreyaghoshal/200/200',
            eventPhotos: ['https://picsum.photos/seed/shreya-event1/600/400', 'https://picsum.photos/seed/shreya-event2/600/400']
          }
        ],
        highlightsGallery: {
          previewImages: [
            'https://picsum.photos/seed/vibgyor22-1/600/400',
            'https://picsum.photos/seed/vibgyor22-2/600/400',
            'https://picsum.photos/seed/vibgyor22-3/600/400',
          ],
          fullGalleryLink: '#',
        },
        organizingTeam: [
            { name: 'Sankeerth Reddy', position: 'Overall Coordinator', imageUrl: 'https://picsum.photos/seed/sankeerth/200/200' },
            { name: 'Emily Clark', position: 'Student Head'}
        ],
      }
    ]
  },
    {
    id: 'vibes',
    name: 'Vibes - A Student Showcase',
    category: 'Cultural',
    shortDescription: 'Day 2 of the cultural fest, dedicated to showcasing student talent, with dance, music, and awards.',
    longDescription: 'Vibes is a celebration of our students\' incredible talents. Following the star-studded Vibgyor night, Day 2 is all about our campus community. The evening features mesmerizing performances from the college\'s official dance and music clubs, hilarious skits from the drama society, and a formal ceremony to honor the academic and extra-curricular achievements of our brightest students. It\'s a night of pride, talent, and unforgettable memories, by the students, for the students.',
    bannerUrl: 'https://picsum.photos/seed/vibesbanner/1600/600',
    registrationEnabled: false,
    yearlyData: [
      {
        year: 2023,
        theme: 'A Night of a Thousand Stars',
        chiefGuests: [
          {
            name: 'Dr. K. Sagar',
            title: 'Principal',
            profileImageUrl: 'https://gcet.edu.in/images/Principal_Sagar.jpg',
          }
        ],
        highlightsGallery: {
          previewImages: [
            'https://picsum.photos/seed/vibes23-1/600/400',
            'https://picsum.photos/seed/vibes23-2/600/400',
            'https://picsum.photos/seed/vibes23-3/600/400',
            'https://picsum.photos/seed/vibes23-4/600/400'
          ],
          fullGalleryLink: '#',
        },
        organizingTeam: [
          { name: 'Nithin Kumar', position: 'Overall Coordinator', imageUrl: 'https://picsum.photos/seed/nithin/200/200' },
          { name: 'Puneeth Varma', position: 'Student Head', imageUrl: 'https://picsum.photos/seed/puneethvarma/200/200' },
        ],
        performances: [
            { performer: 'The Pirates Crew', description: 'High-Energy Hip-Hop Fusion', imageUrl: 'https://picsum.photos/seed/danceperf1/600/400'},
            { performer: 'Desi Swag', description: 'Bollywood Dance Medley', imageUrl: 'https://picsum.photos/seed/danceperf2/600/400'},
            { performer: 'Rhythm Roar', description: 'Live Beatboxing & Mimicry', imageUrl: 'https://picsum.photos/seed/musicperf1/600/400'},
            { performer: 'Ananya Sharma', description: 'Solo Classical Dance', imageUrl: 'https://picsum.photos/seed/skitperf1/600/400'},
        ],
        awardWinners: [
            {
                department: 'Computer Science Engineering',
                winners: [
                    { rank: 1, name: 'Priya Sharma', achievement: '9.8 GPA'},
                    { rank: 2, name: 'Rohan Gupta', achievement: '9.7 GPA'},
                    { rank: 3, name: 'Aisha Khan', achievement: '9.6 GPA'},
                ]
            },
            {
                department: 'Electronics & Communication',
                winners: [
                    { rank: 1, name: 'Rahul Verma', achievement: '9.7 GPA'},
                    { rank: 2, name: 'Sneha Reddy', achievement: '9.6 GPA'},
                    { rank: 3, name: 'Karan Singh', achievement: '9.5 GPA'},
                ]
            },
            {
                department: 'Mechanical Engineering',
                winners: [
                    { rank: 1, name: 'Anjali Mehta', achievement: '9.5 GPA'},
                    { rank: 2, name: 'Vikram Singh', achievement: '9.4 GPA'},
                    { rank: 3, name: 'Pooja Desai', achievement: '9.3 GPA'},
                ]
            }
        ]
      }
    ]
  },
  {
    id: 'bhaswara',
    name: 'Bhaswara - The Tech Fest',
    category: 'Technical',
    shortDescription: 'A grand celebration of technology and innovation, where all engineering departments host a plethora of technical and non-technical events.',
    longDescription: 'Bhaswara is our annual technical festival, a crucible of innovation where theory meets practice. Over several days, each academic department organizes a unique slate of events, from intense coding competitions and robotics challenges to thought-provoking workshops and paper presentations. Alongside the core technical events, Bhaswara is famous for its creative non-technical attractions like treasure hunts and scary houses, ensuring there\'s something for everyone. It\'s a platform for students to showcase their skills, compete with their peers, and learn about the latest technological advancements.',
    bannerUrl: 'https://picsum.photos/seed/bhaswarabanner/1600/600',
    registrationEnabled: true,
    yearlyData: [
      {
        year: 2024,
        chiefGuests: [],
        highlightsGallery: {
          previewImages: [
            'https://picsum.photos/seed/bhaswara24-1/600/400',
            'https://picsum.photos/seed/bhaswara24-2/600/400',
            'https://picsum.photos/seed/bhaswara24-3/600/400',
          ],
          fullGalleryLink: '#',
        },
        organizingTeam: [
          { name: 'Pavan Bejawada', position: 'Overall Coordinator' },
          { name: 'Paramesh K', position: 'Technical Head' },
        ],
        achievements: ['Over 30+ events conducted across 5 departments', 'Record participation of 2000+ students'],
      }
    ]
  },
  {
    id: 'sportsweek',
    name: 'Annual Sports Week',
    category: 'Sports',
    shortDescription: 'A week of intense competition, sportsmanship, and athletic prowess, culminating in the grand Annual Sports Day.',
    longDescription: 'The Annual Sports Week is a cornerstone of our college\'s commitment to holistic development. It is a vibrant week where students from all years and branches compete in a wide array of indoor and outdoor sports, including cricket, football, basketball, chess, and athletics. The week fosters a spirit of healthy competition, teamwork, and resilience. It all culminates in the grand Sports Day, where finalists compete for glory and champions are felicitated in a formal ceremony, celebrating the athletic talent on our campus.',
    bannerUrl: 'https://picsum.photos/seed/sportsbanner/1600/600',
    registrationEnabled: true,
    yearlyData: [
      {
        year: 2023,
        chiefGuests: [
          {
            name: 'P. V. Sindhu',
            title: 'Olympian',
            profileImageUrl: 'https://picsum.photos/seed/pvsindhu/200/200',
          }
        ],
        highlightsGallery: {
          previewImages: [
            'https://picsum.photos/seed/sports23-1/600/400',
            'https://picsum.photos/seed/sports23-2/600/400',
            'https://picsum.photos/seed/sports23-3/600/400',
          ],
          fullGalleryLink: '#',
        },
        organizingTeam: [
          { name: 'Mr. Alex Johnson', position: 'Physical Director' },
          { name: 'Student Sports Secretary', position: 'Student Head' },
        ],
        achievements: ['Cricket Champions: 4th Year CSE', 'Football Champions: 3rd Year Mech'],
        sportsCompetitions: [
            {
                id: 'cricket-23',
                name: 'Cricket',
                description: 'Inter-branch T20 cricket tournament. Bring your team and compete for the championship trophy.',
                icon: '🏏',
                registrationOpen: true,
            },
            {
                id: 'football-23',
                name: 'Football',
                description: '5-a-side football matches. Showcase your skill, teamwork, and sportsmanship on the field.',
                icon: '⚽',
                registrationOpen: true,
            },
            {
                id: 'basketball-23',
                name: 'Basketball',
                description: 'Full-court basketball competition. Form a team and aim for the hoops.',
                icon: '🏀',
                registrationOpen: true,
            },
            {
                id: 'chess-23',
                name: 'Chess',
                description: 'A battle of minds. Compete in our annual chess championship and claim the title of Grandmaster.',
                icon: '♟️',
                registrationOpen: false,
            },
            {
                id: 'athletics-23',
                name: 'Athletics',
                description: 'Track and field events including 100m, 200m sprints, long jump, and shot put.',
                icon: '🏃',
                registrationOpen: true,
            },
        ]
      }
    ]
  }
];
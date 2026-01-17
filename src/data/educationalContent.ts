export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  category: 'capacity' | 'environment' | 'community' | 'carbon' | 'responsibility';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  icon: string;
  content: {
    sections: {
      title: string;
      content: string;
      keyPoints: string[];
      image?: string;
    }[];
  };
  quiz: {
    questions: {
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
  };
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
}

export const educationalModules: EducationalModule[] = [
  {
    id: 'capacity-limits',
    title: 'Understanding Capacity Limits',
    description: 'Learn why tourist destinations have capacity limits and how they protect fragile ecosystems.',
    category: 'capacity',
    difficulty: 'beginner',
    estimatedTime: 10,
    icon: '👥',
    content: {
      sections: [
        {
          title: 'Why Capacity Limits Matter',
          content: 'Tourist capacity limits are not arbitrary restrictions - they are scientifically calculated thresholds designed to protect fragile ecosystems from irreversible damage. When too many visitors converge on a sensitive area, the cumulative impact can devastate local flora, fauna, and geological formations that took centuries to develop.',
          keyPoints: [
            'Prevents soil erosion and trail degradation',
            'Protects wildlife habitats from disturbance',
            'Preserves natural water sources',
            'Maintains the authentic visitor experience'
          ],
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        },
        {
          title: 'How Limits Are Calculated',
          content: 'Capacity limits are determined through comprehensive ecological assessments that consider factors like trail width, vegetation recovery time, wildlife breeding patterns, and infrastructure capacity. Scientists and environmental experts work together to establish sustainable visitor numbers that allow tourism while ensuring long-term preservation.',
          keyPoints: [
            'Based on scientific ecological studies',
            'Consider seasonal variations and weather patterns',
            'Account for infrastructure limitations',
            'Regularly reviewed and adjusted'
          ]
        },
        {
          title: 'Real-World Impact',
          content: 'Destinations that have implemented capacity limits have seen remarkable recovery in their ecosystems. From cleaner trails to healthier wildlife populations, these measures ensure that future generations can enjoy the same natural wonders we appreciate today.',
          keyPoints: [
            '30% reduction in trail erosion in controlled areas',
            'Wildlife populations show less stress behavior',
            'Water quality improves in high-traffic areas',
            'Visitor satisfaction increases with better experience'
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is the primary purpose of tourist capacity limits?',
          options: [
            'To generate more revenue for local businesses',
            'To protect fragile ecosystems from irreversible damage',
            'To make tourism more exclusive',
            'To reduce wait times at attractions'
          ],
          correctAnswer: 1,
          explanation: 'Capacity limits are primarily designed to protect fragile ecosystems from the cumulative damage caused by excessive tourism.'
        },
        {
          id: 'q2',
          question: 'How are capacity limits typically determined?',
          options: [
            'Based on the number of parking spaces available',
            'Through comprehensive ecological assessments',
            'By visitor surveys and preferences',
            'According to the size of the destination'
          ],
          correctAnswer: 1,
          explanation: 'Capacity limits are determined through scientific ecological assessments that consider multiple environmental factors.'
        },
        {
          id: 'q3',
          question: 'What is a common benefit of implementing capacity limits?',
          options: [
            'Increased revenue from higher prices',
            'Reduced environmental impact and better visitor experience',
            'Fewer tourists visiting the area',
            'Faster development of tourism infrastructure'
          ],
          correctAnswer: 1,
          explanation: 'Proper capacity limits lead to reduced environmental impact while actually improving the quality of the visitor experience.'
        }
      ]
    },
    badge: {
      id: 'capacity-guardian',
      name: 'Capacity Guardian',
      description: 'Understanding the importance of visitor limits in protecting natural spaces',
      icon: '🛡️',
      color: 'bg-blue-500'
    }
  },
  {
    id: 'environmental-impact',
    title: 'Your Environmental Footprint',
    description: 'Discover how your visit affects mountain ecosystems and learn ways to minimize your impact.',
    category: 'environment',
    difficulty: 'beginner',
    estimatedTime: 12,
    icon: '🌱',
    content: {
      sections: [
        {
          title: 'The Invisible Impact',
          content: 'Every footprint, every piece of trash, and every noise you make leaves an imprint on mountain ecosystems. These fragile environments have evolved over millennia in isolation, making them extremely vulnerable to human disturbance. Understanding your impact is the first step toward becoming a responsible traveler.',
          keyPoints: [
            'Soil compaction from footsteps can last for years',
            'Wildlife behavior changes with human presence',
            'Non-native species can be introduced accidentally',
            'Water sources are easily contaminated'
          ],
          image: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800'
        },
        {
          title: 'Carbon Footprint of Mountain Tourism',
          content: 'The journey to mountain destinations often involves significant carbon emissions through transportation, accommodation, and activities. However, the carbon footprint doesn\'t end there - it includes the energy used to maintain tourism infrastructure and the long-term ecological restoration needed after damage occurs.',
          keyPoints: [
            'Transportation accounts for 70% of tourism carbon footprint',
            'Mountain lodges use significant energy resources',
            'Helicopter tours have extremely high emissions',
            'Carbon offset programs can help balance impact'
          ]
        },
        {
          title: 'Positive Impact Opportunities',
          content: 'Tourism can also have positive environmental impacts when done responsibly. Your visit can support conservation efforts, provide economic alternatives to destructive practices, and raise awareness about environmental protection.',
          keyPoints: [
            'Tourism revenue funds conservation programs',
            'Local communities gain economic alternatives',
            'Visitors become environmental ambassadors',
            'Supports sustainable development initiatives'
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What percentage of tourism carbon footprint typically comes from transportation?',
          options: [
            'Around 30%',
            'About 50%',
            'Approximately 70%',
            'Nearly 90%'
          ],
          correctAnswer: 2,
          explanation: 'Transportation typically accounts for about 70% of tourism\'s carbon footprint, making it the largest contributor.'
        },
        {
          id: 'q2',
          question: 'How long can soil compaction from footsteps last in mountain environments?',
          options: [
            'A few weeks',
            'Several months',
            'Up to several years',
            'Only a few days'
          ],
          correctAnswer: 2,
          explanation: 'Soil compaction in fragile mountain environments can persist for several years, affecting plant growth and water absorption.'
        },
        {
          id: 'q3',
          question: 'What is a positive environmental impact of responsible tourism?',
          options: [
            'Faster development of mountain areas',
            'Funding conservation programs through tourism revenue',
            'Increased accessibility to remote areas',
            'More infrastructure development'
          ],
          correctAnswer: 1,
          explanation: 'Responsible tourism can generate significant revenue that funds conservation programs and environmental protection initiatives.'
        }
      ]
    },
    badge: {
      id: 'eco-warrior',
      name: 'Eco Warrior',
      description: 'Understanding and minimizing your environmental footprint',
      icon: '🌍',
      color: 'bg-green-500'
    }
  },
  {
    id: 'low-impact-tourism',
    title: 'Low-Impact Tourism Practices',
    description: 'Master the art of treading lightly while enjoying mountain destinations to the fullest.',
    category: 'responsibility',
    difficulty: 'intermediate',
    estimatedTime: 15,
    icon: '🥾',
    content: {
      sections: [
        {
          title: 'Leave No Trace Principles',
          content: 'The Leave No Trace principles are the gold standard for outdoor ethics. These seven guidelines help minimize your impact while maximizing your enjoyment of natural spaces. By following these principles, you ensure that the places you love remain pristine for future visitors.',
          keyPoints: [
            'Plan ahead and prepare for your trip',
            'Travel and camp on durable surfaces',
            'Dispose of waste properly',
            'Leave what you find',
            'Minimize campfire impacts',
            'Respect wildlife',
            'Be considerate of other visitors'
          ],
          image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'
        },
        {
          title: 'Sustainable Gear Choices',
          content: 'Your equipment choices significantly impact your environmental footprint. Opt for durable, repairable gear made from sustainable materials. Consider renting equipment for occasional use rather than buying, and always choose products from companies committed to environmental responsibility.',
          keyPoints: [
            'Choose recycled or sustainable materials',
            'Rent specialized equipment when possible',
            'Maintain and repair gear instead of replacing',
            'Support environmentally conscious brands'
          ]
        },
        {
          title: 'Responsible Wildlife Viewing',
          content: 'Wildlife viewing is a highlight of mountain tourism, but it requires careful consideration. Never feed wild animals, maintain safe distances, and use binoculars or zoom lenses instead of approaching closely. Remember that you are a guest in their home.',
          keyPoints: [
            'Keep at least 100 meters distance from large animals',
            'Never feed wildlife - it creates dependency',
            'Store food securely to prevent encounters',
            'Be quiet and move slowly around animals'
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is the minimum recommended distance to keep from large wildlife?',
          options: [
            '25 meters',
            '50 meters',
            '75 meters',
            '100 meters'
          ],
          correctAnswer: 3,
          explanation: 'The recommended minimum distance is 100 meters from large wildlife to ensure both your safety and their comfort.'
        },
        {
          id: 'q2',
          question: 'Which Leave No Trace principle involves proper waste disposal?',
          options: [
            'Plan ahead and prepare',
            'Dispose of waste properly',
            'Respect wildlife',
            'Travel on durable surfaces'
          ],
          correctAnswer: 1,
          explanation: 'The "Dispose of waste properly" principle specifically addresses how to handle all types of waste responsibly.'
        },
        {
          id: 'q3',
          question: 'What is the most sustainable approach to specialized equipment?',
          options: [
            'Buy the cheapest option available',
            'Rent equipment for occasional use',
            'Purchase multiple options for variety',
            'Borrow from friends without asking'
          ],
          correctAnswer: 1,
          explanation: 'Renting specialized equipment for occasional use is more sustainable than purchasing items that will rarely be used.'
        }
      ]
    },
    badge: {
      id: 'trail-master',
      name: 'Trail Master',
      description: 'Expert in low-impact outdoor practices',
      icon: '🏔️',
      color: 'bg-emerald-500'
    }
  },
  {
    id: 'community-impact',
    title: 'Local Community Impact',
    description: 'Understand how tourism affects mountain communities and how to be a positive force for local development.',
    category: 'community',
    difficulty: 'intermediate',
    estimatedTime: 12,
    icon: '🏘️',
    content: {
      sections: [
        {
          title: 'Economic Benefits and Challenges',
          content: 'Tourism brings significant economic opportunities to mountain communities, but it also presents challenges. While tourism can provide jobs and income, it can also lead to inflation, cultural disruption, and economic dependency. Understanding this balance helps you make choices that truly benefit local communities.',
          keyPoints: [
            'Tourism creates diverse job opportunities',
            'Local businesses gain access to broader markets',
            'Infrastructure development improves quality of life',
            'Risk of economic dependency on tourism'
          ],
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
        },
        {
          title: 'Cultural Preservation and Exchange',
          content: 'Mountain communities often have rich cultural traditions that have been preserved for generations. Your visit can either help preserve these traditions or contribute to their erosion. By showing respect and genuine interest, you become a cultural ambassador rather than just a consumer.',
          keyPoints: [
            'Learn basic local customs and greetings',
            'Support traditional crafts and practices',
            'Be mindful of photography etiquette',
            'Participate respectfully in cultural activities'
          ]
        },
        {
          title: 'Supporting Local Economy',
          content: 'Where you spend your money matters significantly in mountain communities. Choosing locally owned accommodations, restaurants, and tour operators ensures that tourism revenue stays within the community rather than being extracted by international corporations.',
          keyPoints: [
            'Choose locally owned accommodations',
            'Eat at family-run restaurants',
            'Buy souvenirs directly from artisans',
            'Hire local guides and porters'
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is a major challenge that tourism can bring to mountain communities?',
          options: [
            'Too many job opportunities',
            'Economic dependency and cultural disruption',
            'Improved infrastructure',
            'Better healthcare access'
          ],
          correctAnswer: 1,
          explanation: 'Economic dependency on tourism and potential cultural disruption are significant challenges that communities must manage.'
        },
        {
          id: 'q2',
          question: 'How can tourists best support the local economy?',
          options: [
            'Stay at international hotel chains',
            'Choose locally owned businesses and services',
            'Buy imported souvenirs',
            'Use international tour companies exclusively'
          ],
          correctAnswer: 1,
          explanation: 'Choosing locally owned businesses ensures that tourism revenue stays within the community and benefits local residents directly.'
        },
        {
          id: 'q3',
          question: 'What is the best approach to cultural photography?',
          options: [
            'Take photos without asking to capture authentic moments',
            'Always ask permission and respect refusal',
            'Pay people for photos to ensure consent',
            'Avoid photography entirely'
          ],
          correctAnswer: 1,
          explanation: 'Always asking permission and respecting when someone says no is the respectful approach to cultural photography.'
        }
      ]
    },
    badge: {
      id: 'community-champion',
      name: 'Community Champion',
      description: 'Supporting and respecting local mountain communities',
      icon: '🤝',
      color: 'bg-purple-500'
    }
  },
  {
    id: 'carbon-footprint',
    title: 'Carbon Footprint Basics',
    description: 'Learn about carbon emissions from tourism and practical ways to reduce and offset your travel footprint.',
    category: 'carbon',
    difficulty: 'advanced',
    estimatedTime: 18,
    icon: '🌡️',
    content: {
      sections: [
        {
          title: 'Understanding Carbon Emissions',
          content: 'Carbon emissions from tourism encompass more than just your flight - they include accommodation, activities, food, and even the energy used to maintain tourism infrastructure. Understanding the full scope helps you make informed decisions about your travel choices.',
          keyPoints: [
            'Transportation is the largest emission source',
            'Accommodation energy use varies significantly',
            'Food choices impact your carbon footprint',
            'Activities and equipment have hidden emissions'
          ],
          image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'
        },
        {
          title: 'Measuring Your Travel Footprint',
          content: 'Carbon calculators can help estimate your travel emissions, but understanding the factors involved is more important than exact numbers. Distance, mode of transport, accommodation type, and duration all play crucial roles in your total carbon footprint.',
          keyPoints: [
            'Flights: highest emissions per kilometer',
            'Trains: lowest emissions for long distances',
            'Electric vehicles: depend on energy source',
            'Camping: minimal accommodation emissions'
          ]
        },
        {
          title: 'Reduction and Offset Strategies',
          content: 'Reducing emissions is always better than offsetting, but when reduction isn\'t possible, quality offsets can help balance your impact. Focus on direct emissions reduction first, then support verified offset projects that actually remove carbon from the atmosphere.',
          keyPoints: [
            'Choose closer destinations when possible',
            'Use public transportation within destinations',
            'Select energy-efficient accommodations',
            'Support verified carbon offset programs'
          ]
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'Which transportation mode typically has the highest carbon emissions per kilometer?',
          options: [
            'Train travel',
            'Electric car',
            'Domestic flight',
            'Bus travel'
          ],
          correctAnswer: 2,
          explanation: 'Domestic flights typically have the highest carbon emissions per kilometer due to the intensive fuel consumption during takeoff and cruising.'
        },
        {
          id: 'q2',
          question: 'What is the most effective approach to managing travel carbon emissions?',
          options: [
            'Only using carbon offsets',
            'Focusing on reduction first, then offsetting',
            'Ignoring emissions as unavoidable',
            'Choosing longer trips to reduce frequency'
          ],
          correctAnswer: 1,
          explanation: 'The most effective approach is to focus on reducing emissions first, then using quality offsets for unavoidable emissions.'
        },
        {
          id: 'q3',
          question: 'What factor significantly affects accommodation carbon emissions?',
          options: [
            'Room size only',
            'Energy source and efficiency of the property',
            'Distance from city center',
            'Price of the room'
          ],
          correctAnswer: 1,
          explanation: 'The energy source and efficiency of the accommodation property are the primary factors affecting its carbon emissions.'
        }
      ]
    },
    badge: {
      id: 'carbon-neutral',
      name: 'Carbon Neutral',
      description: 'Understanding and managing travel carbon emissions',
      icon: '⚖️',
      color: 'bg-slate-500'
    }
  }
];

export const externalResources = [
  {
    title: 'Leave No Trace Center for Outdoor Ethics',
    url: 'https://lnt.org/',
    description: 'Comprehensive guidelines for minimizing outdoor impact',
    category: 'ethics'
  },
  {
    title: 'International Ecotourism Society',
    url: 'https://www.ecotourism.org/',
    description: 'Global standards and best practices for responsible tourism',
    category: 'standards'
  },
  {
    title: 'Mountain Resilience Coalition',
    url: 'https://www.mountainresilience.org/',
    description: 'Research and initiatives for sustainable mountain tourism',
    category: 'research'
  },
  {
    title: 'Carbon Offset Guide',
    url: 'https://www.carbonoffsetguide.org/',
    description: 'Independent evaluation of carbon offset programs',
    category: 'carbon'
  },
  {
    title: 'World Responsible Tourism Awards',
    url: 'https://www.responsibletourismpartnership.org/',
    description: 'Examples of excellence in sustainable tourism',
    category: 'inspiration'
  }
];

export interface UserProgress {
  completedModules: string[];
  earnedBadges: string[];
  quizScores: Record<string, number>;
  totalTimeSpent: number;
  lastAccessed: Date;
}

export const defaultUserProgress: UserProgress = {
  completedModules: [],
  earnedBadges: [],
  quizScores: {},
  totalTimeSpent: 0,
  lastAccessed: new Date()
};

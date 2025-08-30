import { useState } from 'react';

interface InterestSelectorProps {
  onInterestsSelected: (interests: string[]) => void;
  disabled?: boolean;
}

const INTEREST_CATEGORIES = [
  {
    name: 'Technology',
    interests: ['Programming', 'AI/ML', 'Gaming', 'Web Development', 'Mobile Apps', 'Cybersecurity', 'Data Science']
  },
  {
    name: 'Arts & Culture',
    interests: ['Music', 'Movies', 'Books', 'Art', 'Photography', 'Writing', 'Dance', 'Theater']
  },
  {
    name: 'Sports & Fitness',
    interests: ['Football', 'Basketball', 'Tennis', 'Gym', 'Yoga', 'Running', 'Swimming', 'Hiking']
  },
  {
    name: 'Travel & Adventure',
    interests: ['Backpacking', 'Road Trips', 'International Travel', 'Camping', 'Mountaineering', 'Beach', 'City Exploration']
  },
  {
    name: 'Food & Cooking',
    interests: ['Cooking', 'Baking', 'Restaurants', 'Food Photography', 'Wine', 'Coffee', 'International Cuisine']
  },
  {
    name: 'Science & Nature',
    interests: ['Physics', 'Biology', 'Chemistry', 'Astronomy', 'Environment', 'Animals', 'Plants', 'Space']
  },
  {
    name: 'Business & Finance',
    interests: ['Entrepreneurship', 'Investing', 'Marketing', 'Startups', 'Cryptocurrency', 'Real Estate', 'Stock Market']
  },
  {
    name: 'Lifestyle',
    interests: ['Fashion', 'Beauty', 'Health', 'Meditation', 'Self-Improvement', 'Relationships', 'Parenting']
  }
];

export default function InterestSelector({ onInterestsSelected, disabled = false }: InterestSelectorProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 10) { // Limit to 10 interests
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedInterests.length > 0) {
      onInterestsSelected(selectedInterests);
    }
  };

  const filteredCategories = INTEREST_CATEGORIES.map(category => ({
    ...category,
    interests: category.interests.filter(interest =>
      interest.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.interests.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search interests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Interest Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">{category.name}</h3>
            <div className="flex flex-wrap gap-3">
              {category.interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedInterests.includes(interest)
                      ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Interests Summary */}
      {selectedInterests.length > 0 && (
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Selected Interests ({selectedInterests.length}/10)
          </h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedInterests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium flex items-center space-x-2"
              >
                <span>{interest}</span>
                <button
                  onClick={() => handleInterestToggle(interest)}
                  disabled={disabled}
                  className="ml-2 hover:text-red-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={disabled || selectedInterests.length === 0}
            className="w-full bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {disabled ? 'Finding Match...' : `Start Matching (${selectedInterests.length} interests)`}
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 text-center text-white/60 text-sm">
        <p>💡 Tip: Select 3-7 interests for the best matching results</p>
        <p>🔒 Your interests are only used for matching and are never shared</p>
      </div>
    </div>
  );
}

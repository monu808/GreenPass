'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Target, CheckCircle, 
  ArrowRight, Users, Leaf, Mountain,
  Globe, Heart, Trophy,
  ChevronRight, Lock, RefreshCw
} from 'lucide-react';
import TouristLayout from '@/components/TouristLayout';
import { 
  educationalModules, 
  externalResources, 
  UserProgress, 
  EducationalModule,
  defaultUserProgress 
} from '@/data/educationalContent';

export default function SustainabilityEducation() {
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [selectedModule, setSelectedModule] = useState<EducationalModule | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem('sustainability-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setUserProgress({ ...defaultUserProgress, ...parsed });
      } catch (err) {
        console.warn('Invalid sustainability-progress in localStorage', err);
        localStorage.removeItem('sustainability-progress');
        setUserProgress(defaultUserProgress);
      }
    }
    setLoading(false);
  }, []);

  const saveProgress = (newProgress: UserProgress) => {
    setUserProgress(newProgress);
    localStorage.setItem('sustainability-progress', JSON.stringify(newProgress));
  };

  const startModule = (module: EducationalModule) => {
    setSelectedModule(module);
    setCurrentSection(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setShowBadge(false);
  };

  const nextSection = () => {
    if (selectedModule && currentSection < selectedModule.content.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (selectedModule) {
      setShowQuiz(true);
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: answerIndex });
  };

  const submitQuiz = () => {
    if (!selectedModule) return;

    let correct = 0;
    selectedModule.quiz.questions.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / selectedModule.quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= 70) {
      const newProgress: UserProgress = {
        ...userProgress,
        completedModules: [...userProgress.completedModules, selectedModule.id],
        earnedBadges: [...userProgress.earnedBadges, selectedModule.badge.id],
        quizScores: { ...userProgress.quizScores, [selectedModule.id]: score },
        totalTimeSpent: userProgress.totalTimeSpent + selectedModule.estimatedTime,
        lastAccessed: new Date()
      };
      saveProgress(newProgress);
      setShowBadge(true);
    } else {
      const newProgress: UserProgress = {
        ...userProgress,
        quizScores: { ...userProgress.quizScores, [selectedModule.id]: score },
        totalTimeSpent: userProgress.totalTimeSpent + selectedModule.estimatedTime,
        lastAccessed: new Date()
      };
      saveProgress(newProgress);
    }
  };

  const resetModule = () => {
    setSelectedModule(null);
    setCurrentSection(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setShowBadge(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'capacity': return <Users className="h-5 w-5" />;
      case 'environment': return <Leaf className="h-5 w-5" />;
      case 'community': return <Heart className="h-5 w-5" />;
      case 'carbon': return <Globe className="h-5 w-5" />;
      case 'responsibility': return <Mountain className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const earnedBadges = educationalModules.filter(module => 
    userProgress.earnedBadges.includes(module.badge.id)
  );

  if (loading) {
    return (
      <TouristLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Loading Sustainability Hub...</p>
        </div>
      </TouristLayout>
    );
  }

  if (selectedModule) {
    return (
      <TouristLayout>
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {/* Module Header */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={resetModule}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Modules
              </button>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(selectedModule.difficulty)}`}>
                  {selectedModule.difficulty}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{selectedModule.estimatedTime} min</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
                {selectedModule.icon}
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{selectedModule.title}</h1>
                <p className="text-gray-600 mt-1">{selectedModule.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSection + 1) / (selectedModule.content.sections.length + 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Content Sections */}
          {!showQuiz ? (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="space-y-8">
                {selectedModule.content.sections[currentSection].image && (
                  <div className="rounded-2xl overflow-hidden">
                    <img 
                      src={selectedModule.content.sections[currentSection].image}
                      alt={selectedModule.content.sections[currentSection].title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {selectedModule.content.sections[currentSection].title}
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {selectedModule.content.sections[currentSection].content}
                  </p>
                  
                  <div className="bg-emerald-50 rounded-2xl p-6">
                    <h3 className="font-black text-emerald-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Key Points
                    </h3>
                    <ul className="space-y-3">
                      {selectedModule.content.sections[currentSection].keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-emerald-800">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6">
                  <button
                    onClick={previousSection}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-500 font-bold">
                    {currentSection + 1} of {selectedModule.content.sections.length}
                  </span>
                  
                  <button
                    onClick={nextSection}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {currentSection === selectedModule.content.sections.length - 1 ? 'Start Quiz' : 'Next'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
              <div className="space-y-8">
                {!quizSubmitted ? (
                  <>
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
                        <Trophy className="h-10 w-10 text-amber-600" />
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Knowledge Check</h2>
                      <p className="text-gray-600">Test your understanding of the material</p>
                    </div>

                    <div className="space-y-6">
                      {selectedModule.quiz.questions.map((question, qIndex) => (
                        <div key={question.id} className="bg-gray-50 rounded-2xl p-6">
                          <h3 className="font-bold text-gray-900 mb-4">
                            {qIndex + 1}. {question.question}
                          </h3>
                          <div className="space-y-3">
                            {question.options.map((option, oIndex) => (
                              <label
                                key={oIndex}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white hover:bg-emerald-50 hover:border-emerald-300"
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  checked={quizAnswers[question.id] === oIndex}
                                  onChange={() => handleQuizAnswer(question.id, oIndex)}
                                  className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length !== selectedModule.quiz.questions.length}
                      className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-8">
                    {showBadge && (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        <div className={`w-24 h-24 rounded-2xl ${selectedModule.badge.color} flex items-center justify-center mx-auto text-4xl`}>
                          {selectedModule.badge.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Badge Earned!</h3>
                          <p className="text-gray-600 mt-2">{selectedModule.badge.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{selectedModule.badge.description}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        Your Score: {quizScore}%
                      </h3>
                      <p className="text-gray-600">
                        {quizScore >= 70 
                          ? "Congratulations! You've passed the quiz and earned your badge."
                          : "You need 70% or higher to pass. Review the material and try again."
                        }
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedModule.quiz.questions.map((question, index) => (
                        <div key={question.id} className="bg-gray-50 rounded-2xl p-4 text-left">
                          <p className="font-bold text-gray-900 mb-2">{question.question}</p>
                          <p className={`text-sm ${quizAnswers[question.id] === question.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                            Your answer: {question.options[quizAnswers[question.id]]}
                          </p>
                          {quizAnswers[question.id] !== question.correctAnswer && (
                            <p className="text-sm text-green-600">
                              Correct answer: {question.options[question.correctAnswer]}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-2">{question.explanation}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={resetModule}
                        className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        Back to Modules
                      </button>
                      {quizScore < 70 && (
                        <button
                          onClick={() => {
                            setShowQuiz(false);
                            setCurrentSection(0);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                          }}
                          className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </TouristLayout>
    );
  }

  return (
    <TouristLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20 px-6">
        
        {/* Hero Section */}
        <div className="relative h-[400px] rounded-[3.5rem] overflow-hidden group shadow-2xl shadow-emerald-900/10">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            alt="Sustainability Education"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-transparent" />
          <div className="relative h-full flex flex-col justify-center p-12 sm:p-20 space-y-6 max-w-4xl">
            <div className="flex items-center gap-2 text-emerald-400">
               <Leaf className="h-5 w-5 fill-current" />
               <span className="text-[10px] font-black tracking-[0.4em] uppercase">Sustainability Education</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
              Learn to Protect <br/> <span className="text-emerald-400">Our Mountains</span>
            </h1>
            <p className="text-emerald-50/80 font-bold text-lg max-w-xl leading-relaxed">
              Discover how to be a responsible tourist and protect fragile mountain ecosystems for future generations.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{educationalModules.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modules</p>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-7 w-7 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{earnedBadges.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Badges Earned</p>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{userProgress.totalTimeSpent}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minutes Learned</p>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-7 w-7 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-gray-900">{userProgress.completedModules.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</p>
          </div>
        </div>

        {/* Educational Modules */}
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Educational Modules</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {educationalModules.map((module) => {
              const isCompleted = userProgress.completedModules.includes(module.id);
              const hasBadge = userProgress.earnedBadges.includes(module.badge.id);
              const score = userProgress.quizScores[module.id];

              return (
                <div key={module.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">{module.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-xs font-bold">Completed</span>
                        </div>
                      ) : (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(module.category)}
                        <span className="text-sm text-gray-500 capitalize">{module.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{module.estimatedTime} min</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>

                    {score && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quiz Score</span>
                          <span className={`font-bold ${score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {score}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasBadge && (
                          <div className={`w-8 h-8 rounded-xl ${module.badge.color} flex items-center justify-center text-sm`}>
                            {module.badge.icon}
                          </div>
                        )}
                        <span className="text-sm text-gray-500">{module.badge.name}</span>
                      </div>
                      
                      <button
                        onClick={() => startModule(module)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {isCompleted ? 'Review' : 'Start'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Your Badges</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {earnedBadges.map((badge) => (
                <div key={badge.badge.id} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                  <div className={`w-16 h-16 rounded-2xl ${badge.badge.color} flex items-center justify-center mx-auto mb-4 text-2xl`}>
                    {badge.badge.icon}
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">{badge.badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{badge.badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Resources */}
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">External Resources</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {externalResources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                    <span className="inline-block mt-3 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                      {resource.category}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </TouristLayout>
  );
}

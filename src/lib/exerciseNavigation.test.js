/**
 * Simple test for exercise navigation logic
 */

import { 
  findNextIncompleteExercise,
  findFirstIncompleteInSection,
  findLastIncompleteInSection,
  getNextSection,
  getPreviousSection,
  getNextExerciseAfterSectionComplete,
  areAllExercisesComplete
} from './exerciseNavigation.js';

// Mock exercise data
const mockExercises = [
  { exercise_id: 'warmup-1', name: 'Warmup 1', section: 'warmup' },
  { exercise_id: 'warmup-2', name: 'Warmup 2', section: 'warmup' },
  { exercise_id: 'training-1', name: 'Training 1', section: 'training' },
  { exercise_id: 'training-2', name: 'Training 2', section: 'training' },
  { exercise_id: 'cooldown-1', name: 'Cooldown 1', section: 'cooldown' }
];

const mockSectionExercises = {
  warmup: [
    { exercise_id: 'warmup-1', name: 'Warmup 1' },
    { exercise_id: 'warmup-2', name: 'Warmup 2' }
  ],
  training: [
    { exercise_id: 'training-1', name: 'Training 1' },
    { exercise_id: 'training-2', name: 'Training 2' }
  ],
  cooldown: [
    { exercise_id: 'cooldown-1', name: 'Cooldown 1' }
  ]
};

// Test functions
export const testExerciseNavigation = () => {
  console.log('🧪 Testing Exercise Navigation Logic...');
  
  try {
    // Test 1: Find next incomplete exercise
    const completedExercises = new Set(['warmup-1']);
    const nextExercise = findNextIncompleteExercise(mockExercises, 'warmup-1', completedExercises);
    console.log('✅ Next incomplete exercise:', nextExercise?.name);
    
    // Test 2: Find first incomplete in section
    const firstIncomplete = findFirstIncompleteInSection(mockSectionExercises.warmup, completedExercises);
    console.log('✅ First incomplete in warmup:', firstIncomplete?.name);
    
    // Test 3: Section navigation
    const nextSection = getNextSection('warmup');
    const prevSection = getPreviousSection('training');
    console.log('✅ Next section after warmup:', nextSection);
    console.log('✅ Previous section before training:', prevSection);
    
    // Test 4: Section completion navigation
    const nextAfterWarmupComplete = getNextExerciseAfterSectionComplete(
      'warmup', 
      mockSectionExercises, 
      new Set(['warmup-1', 'warmup-2'])
    );
    console.log('✅ Next exercise after warmup complete:', nextAfterWarmupComplete?.name);
    
    // Test 5: All exercises complete
    const allComplete = areAllExercisesComplete(
      mockSectionExercises, 
      new Set(['warmup-1', 'warmup-2', 'training-1', 'training-2', 'cooldown-1'])
    );
    console.log('✅ All exercises complete:', allComplete);
    
    console.log('🎉 All navigation tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
    return false;
  }
};

// Test specific scenarios
export const testNavigationScenarios = () => {
  console.log('🧪 Testing Navigation Scenarios...');
  
  const scenarios = [
    {
      name: 'Complete warmup, go to training',
      completedExercises: new Set(['warmup-1', 'warmup-2']),
      completedSection: 'warmup',
      expectedNext: 'training-1'
    },
    {
      name: 'Complete training, go to cooldown',
      completedExercises: new Set(['warmup-1', 'warmup-2', 'training-1', 'training-2']),
      completedSection: 'training',
      expectedNext: 'cooldown-1'
    },
    {
      name: 'Complete cooldown, end workout',
      completedExercises: new Set(['warmup-1', 'warmup-2', 'training-1', 'training-2', 'cooldown-1']),
      completedSection: 'cooldown',
      expectedNext: null
    }
  ];
  
  scenarios.forEach(scenario => {
    const result = getNextExerciseAfterSectionComplete(
      scenario.completedSection,
      mockSectionExercises,
      scenario.completedExercises
    );
    
    const success = result?.exercise_id === scenario.expectedNext || 
                   (result === null && scenario.expectedNext === null);
    
    console.log(`${success ? '✅' : '❌'} ${scenario.name}:`, 
                result?.name || 'End workout');
  });
};

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testExerciseNavigation = testExerciseNavigation;
  window.testNavigationScenarios = testNavigationScenarios;
} 
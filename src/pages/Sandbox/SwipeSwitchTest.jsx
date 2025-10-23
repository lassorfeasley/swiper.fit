import React, { useState } from 'react';
import DeckWrapper from '@/components/common/Cards/Wrappers/DeckWrapper';
import SwipeSwitch from '@/pages/Workout/components/swipe-switch';
import { Button } from '@/components/shadcn/button';

export default function SwipeSwitchTest() {
  const [testSets, setTestSets] = useState([
    {
      id: 'set-1',
      routine_set_id: 'routine-set-1',
      status: 'default',
      reps: 10,
      weight: 135,
      weight_unit: 'lbs',
      set_variant: 'Set 1',
      set_type: 'reps',
      timed_set_duration: null,
      isOptimistic: false,
      account_id: 'test-user'
    },
    {
      id: 'set-2',
      routine_set_id: 'routine-set-2',
      status: 'default',
      reps: 8,
      weight: 155,
      weight_unit: 'lbs',
      set_variant: 'Set 2',
      set_type: 'reps',
      timed_set_duration: null,
      isOptimistic: false,
      account_id: 'test-user'
    },
    {
      id: 'set-3',
      routine_set_id: 'routine-set-3',
      status: 'default',
      reps: null,
      weight: null,
      weight_unit: 'body',
      set_variant: 'Set 3',
      set_type: 'timed',
      timed_set_duration: 60,
      isOptimistic: false,
      account_id: 'test-user'
    },
    {
      id: 'set-4',
      routine_set_id: 'routine-set-4',
      status: 'complete',
      reps: 12,
      weight: 95,
      weight_unit: 'lbs',
      set_variant: 'Set 4',
      set_type: 'reps',
      timed_set_duration: null,
      isOptimistic: false,
      account_id: 'test-user'
    }
  ]);

  const [animationSettings, setAnimationSettings] = useState({
    duration: 0.35,
    ease: 'easeInOut',
    thumbWidth: 80,
    railPadding: 8
  });

  const handleSetComplete = (setId) => {
    console.log('Set completed:', setId);
    setTestSets(prev => prev.map(set => 
      set.id === setId ? { ...set, status: 'complete' } : set
    ));
  };

  const handleSetClick = (setId) => {
    console.log('Set clicked:', setId);
  };

  const resetAllSets = () => {
    setTestSets(prev => prev.map(set => ({ ...set, status: 'default' })));
  };

  const completeAllSets = () => {
    setTestSets(prev => prev.map(set => ({ ...set, status: 'complete' })));
  };

  const addNewSet = () => {
    const newSet = {
      id: `set-${Date.now()}`,
      routine_set_id: `routine-set-${Date.now()}`,
      status: 'default',
      reps: Math.floor(Math.random() * 15) + 5,
      weight: Math.floor(Math.random() * 100) + 50,
      weight_unit: 'lbs',
      set_variant: `Set ${testSets.length + 1}`,
      set_type: 'reps',
      timed_set_duration: null,
      isOptimistic: false,
      account_id: 'test-user'
    };
    setTestSets(prev => [...prev, newSet]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DeckWrapper 
        gap={16}
        paddingX={20}
        maxWidth={500}
        className="pt-20"
      >
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Swipe Switch Animation Test</h1>
          <p className="text-gray-600 mb-6">
            Test and debug the swipe-switch animation. Try swiping the sets to complete them.
          </p>
          
          {/* Controls */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Test Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={resetAllSets} variant="outline" size="sm">
                Reset All Sets
              </Button>
              <Button onClick={completeAllSets} variant="outline" size="sm">
                Complete All Sets
              </Button>
              <Button onClick={addNewSet} variant="outline" size="sm">
                Add New Set
              </Button>
            </div>
          </div>

          {/* Animation Settings */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Animation Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  value={animationSettings.duration}
                  onChange={(e) => setAnimationSettings(prev => ({
                    ...prev,
                    duration: parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumb Width (px)
                </label>
                <input
                  type="number"
                  min="60"
                  max="120"
                  value={animationSettings.thumbWidth}
                  onChange={(e) => setAnimationSettings(prev => ({
                    ...prev,
                    thumbWidth: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Sets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Sets</h3>
            {testSets.map((set, index) => (
              <div key={set.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {set.set_variant} - Status: {set.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {set.id}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {set.set_type === 'timed' 
                      ? `Duration: ${set.timed_set_duration}s`
                      : `Reps: ${set.reps}, Weight: ${set.weight}${set.weight_unit}`
                    }
                  </div>
                </div>
                
                <SwipeSwitch
                  set={set}
                  onComplete={() => handleSetComplete(set.id)}
                  onClick={() => handleSetClick(set.id)}
                  className="w-full"
                  demo={false}
                />
              </div>
            ))}
          </div>

          {/* Debug Info */}
          <div className="bg-gray-100 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold mb-3">Debug Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total Sets: {testSets.length}</div>
              <div>Completed Sets: {testSets.filter(s => s.status === 'complete').length}</div>
              <div>Default Sets: {testSets.filter(s => s.status === 'default').length}</div>
              <div>Animation Duration: {animationSettings.duration}s</div>
              <div>Thumb Width: {animationSettings.thumbWidth}px</div>
            </div>
          </div>
        </div>
      </DeckWrapper>
    </div>
  );
}

import React, { useState } from 'react';
import { useOGImageGenerator } from '../hooks/useOGImageGenerator';

export default function OGImageTest() {
  const [workoutId, setWorkoutId] = useState('6385499d-a9f2-4161-b6bb-1b90256d605c');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const { generateOGImage, isGenerating, error } = useOGImageGenerator();

  const handleGenerate = async () => {
    try {
      const imageUrl = await generateOGImage(workoutId, {
        routineName: 'Chest and Triceps',
        workoutName: 'Tuesday Morning Workout',
        date: 'September 9, 2025',
        duration: '3h 25m',
        exerciseCount: 15,
        setCount: 34
      });
      setGeneratedUrl(imageUrl);
    } catch (err) {
      console.error('Failed to generate OG image:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>OG Image Generator Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Workout ID:
          <input
            type="text"
            value={workoutId}
            onChange={(e) => setWorkoutId(e.target.value)}
            style={{ width: '100%', marginTop: '5px', padding: '8px' }}
          />
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{
          padding: '10px 20px',
          backgroundColor: isGenerating ? '#ccc' : '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate OG Image'}
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {generatedUrl && (
        <div>
          <h3>Generated Image URL:</h3>
          <p style={{ wordBreak: 'break-all', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {generatedUrl}
          </p>
          
          <h3>Preview:</h3>
          <img
            src={generatedUrl}
            alt="Generated OG Image"
            style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '5px' }}
          />
          
          <h3>Test Links:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`https://www.swiper.fit/api/og-image?workoutId=${workoutId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              Test API Endpoint
            </a>
            
            <a
              href={`https://www.swiper.fit/history/public/workout/${workoutId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              Test Workout Page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

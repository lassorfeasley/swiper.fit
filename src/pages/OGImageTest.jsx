import React, { useState } from 'react';
import { useOGImageGenerator } from '../hooks/useOGImageGenerator';

export default function OGImageTest() {
  const [workoutId, setWorkoutId] = useState('6385499d-a9f2-4161-b6bb-1b90256d605c');
  const [routineId, setRoutineId] = useState('test-routine-id');
  const [userId, setUserId] = useState('test-user-id');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const { generateOGImage, isGenerating, error } = useOGImageGenerator();

  const handleGenerateWorkoutOG = async () => {
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>OG Image Generator Test</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Workout OG Image Test */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Workout OG Image</h2>
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
            onClick={handleGenerateWorkoutOG}
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
            {isGenerating ? 'Generating...' : 'Generate Workout OG Image'}
          </button>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`https://www.swiper.fit/api/generate-og-image?workoutId=${workoutId}`}
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
              Test Server-Side Generation
            </a>
            
            <a
              href={`https://www.swiper.fit/api/og-image?workoutId=${workoutId}`}
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
              Test OG Image API
            </a>
          </div>
        </div>

        {/* Routine OG Image Test */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Routine OG Image</h2>
          <div style={{ marginBottom: '20px' }}>
            <label>
              Routine ID:
              <input
                type="text"
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value)}
                style={{ width: '100%', marginTop: '5px', padding: '8px' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`https://www.swiper.fit/api/generate-routine-og-image?routineId=${routineId}`}
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
              Test Routine OG Image
            </a>
            
            <a
              href={`https://www.swiper.fit/routines/public/${routineId}`}
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
              Test Routine Page
            </a>
          </div>
        </div>
      </div>

      {/* User History OG Image Test */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>User History OG Image</h2>
        <div style={{ marginBottom: '20px' }}>
          <label>
            User ID:
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: '100%', marginTop: '5px', padding: '8px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={`https://www.swiper.fit/api/generate-user-history-og-image?userId=${userId}`}
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
            Test User History OG Image
          </a>
          
          <a
            href={`https://www.swiper.fit/history/public/${userId}`}
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
            Test History Page
          </a>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
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
        </div>
      )}

      {/* Social Media Testing */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Social Media Testing</h2>
        <p>Use these tools to test how your OG images appear on social media:</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=https://www.swiper.fit/history/public/workout/${workoutId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#1877f2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            Test on Facebook
          </a>
          
          <a
            href={`https://twitter.com/intent/tweet?url=https://www.swiper.fit/history/public/workout/${workoutId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#1da1f2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            Test on Twitter
          </a>
          
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.swiper.fit/history/public/workout/${workoutId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#0077b5',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            Test on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}

# Suflate Testing Guide

## Testing Before Auth & Workspace (Epic 2) is Complete

You can test Suflate even before authentication and workspace features are implemented. The app uses placeholder authentication for testing.

## Quick Start Testing

### 1. Set Up Environment Variables

Make sure your `.env.local` file has all required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# APIs
ASSEMBLYAI_API_KEY=your-assemblyai-key
OPENROUTER_API_KEY=your-openrouter-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test Mode (optional - enables placeholder auth)
NEXT_PUBLIC_TEST_MODE=true
TEST_USER_ID=test-user-id
TEST_WORKSPACE_ID=test-workspace-id
```

### 2. Run the Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### 3. Test the Application

#### Test Authentication Status

Visit: `http://localhost:3000/api/test-auth`

This endpoint checks:
- Supabase connection
- Authentication availability
- Test mode status

#### Test Voice Recording (Story 1.1)

1. Navigate to: `http://localhost:3000/record`
2. Click the microphone button to start recording
3. Record for up to 3 minutes
4. Test pause/resume/stop functionality
5. Play back the recording
6. Upload the recording

#### Test File Upload (Story 1.2)

1. Navigate to: `http://localhost:3000/record`
2. Click "Upload Audio File"
3. Select a valid audio file (MP3, WAV, WebM, OGG, M4A)
4. Verify validation works (try invalid file types, large files)

#### Test Transcription (Story 1.3)

1. After uploading a recording, you'll be redirected to `/record/{id}`
2. Click "Transcribe" button
3. Wait for transcription to complete
4. Verify transcription text appears

#### Test Transcription Editing (Story 1.4)

1. After transcription completes, edit the text
2. Save changes
3. Verify changes are saved

#### Test Amplification (Story 1.5)

1. After editing transcription, click "Amplify into Posts"
2. Wait for amplification to complete
3. You'll be redirected to `/record/{id}/posts`

#### Test Post Variations (Story 1.6)

1. View all 5 post variations
2. Verify each has a label
3. Select a variation
4. Test Edit and Publish buttons

## Testing with Placeholder Auth

The app currently uses placeholder authentication values:
- `userId`: 'placeholder-user-id'
- `workspaceId`: 'placeholder-workspace-id'

These work for testing, but data won't be properly isolated until Epic 2 is complete.

## Manual Testing Checklist

### Story 1.1: Record Voice Note
- [ ] Record voice note (up to 3 minutes)
- [ ] Timer counts correctly
- [ ] Waveform visualization appears
- [ ] Pause/resume works
- [ ] Stop recording works
- [ ] Playback works
- [ ] Auto-stop at 3 minutes works

### Story 1.2: Upload Existing Audio File
- [ ] Upload valid audio file (MP3, WAV, WebM, OGG, M4A)
- [ ] Validation rejects invalid file types
- [ ] Validation rejects files > 10MB
- [ ] Duration validation works (1s - 3min)

### Story 1.3: Transcribe Voice Note
- [ ] Transcription button appears after upload
- [ ] Transcription starts when clicked
- [ ] Processing status shows "Transcribing..."
- [ ] Transcription text appears when complete
- [ ] Language detection works

### Story 1.4: Edit Transcription
- [ ] Transcription is editable
- [ ] Character and word count updates
- [ ] Save button works
- [ ] Auto-save works (after 2 seconds)
- [ ] Cancel button restores original text

### Story 1.5: Amplify into Posts
- [ ] Amplify button appears after transcription
- [ ] Processing status shows "Structuring your thoughts…"
- [ ] 5 post variations are generated
- [ ] Variations are stored in database

### Story 1.6: View Post Variations
- [ ] All 5 variations are displayed
- [ ] Each variation has correct label
- [ ] Variations are selectable
- [ ] Edit and Publish buttons work

## Known Limitations (Before Epic 2)

1. **No Real Authentication**: Using placeholder user/workspace IDs
2. **No User Isolation**: All test data uses same workspace
3. **No Multi-workspace Support**: Can't test workspace switching
4. **No Credit System**: Credits aren't deducted (todos in code)

## Running Tests

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm test -- --testPathPattern="integration"
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

## Troubleshooting

### Supabase Connection Issues

1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is active
3. Check database tables exist (run migrations if needed)

### API Key Issues

1. Verify `ASSEMBLYAI_API_KEY` is set
2. Verify `OPENROUTER_API_KEY` is set
3. Check API keys are valid and have credits

### Test Failures

1. Most failures are due to NextResponse mocking in test environment
2. Unit tests should all pass (they do)
3. Integration tests may need NextResponse mock fixes (known issue)

### Application Not Starting

1. Check all environment variables are set
2. Run `npm install` to ensure dependencies are installed
3. Check for TypeScript errors: `npm run type-check`

## Next Steps After Testing

1. Complete Epic 2 (Auth & Workspace) for real authentication
2. Fix remaining integration test mocking issues
3. Add credit system implementation
4. Add caching for transcriptions
5. Add more error handling and edge cases

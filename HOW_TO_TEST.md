# 🧪 How to Test Suflate

## ✅ You Can Test Right Now!

Even though Epic 2 (Auth & Workspace) isn't complete, you can fully test all Epic 1 features. The app uses **placeholder authentication** for testing.

## Prerequisites

✅ Your `.env.local` file has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ASSEMBLYAI_API_KEY`
- `OPENROUTER_API_KEY`

## Start Testing (3 Steps)

### 1. Start the App

```bash
npm run dev
```

### 2. Visit Test Page

Open: **http://localhost:3000/test**

This shows:
- ✅ Authentication status
- ✅ Supabase connection status
- ✅ Quick links to test all features

### 3. Test the Full Flow

#### Option A: Quick Test (Test Page)

1. Go to: **http://localhost:3000/test**
2. Click test buttons to jump to each feature

#### Option B: Manual Test (Full Flow)

1. **Record Voice**: http://localhost:3000/record
   - Click microphone button
   - Record 30 seconds of anything
   - Click stop and upload

2. **Transcribe**: After upload
   - Click "Transcribe" button
   - Wait for transcription

3. **Edit**: After transcription
   - Edit the text
   - Save changes

4. **Amplify**: After editing
   - Click "Amplify into Posts"
   - Wait for 5 variations

5. **View Variations**: After amplification
   - See all 5 variations
   - Select one
   - Use Edit/Publish buttons

## What to Test

### ✅ Story 1.1: Record Voice Note

**Test at**: http://localhost:3000/record

**What to test:**
- [ ] Click microphone - recording starts immediately
- [ ] Timer counts 0:00 to 3:00
- [ ] Waveform visualization appears
- [ ] Pause button works
- [ ] Resume button works
- [ ] Stop button works
- [ ] Playback works before upload
- [ ] Auto-stop at 3:00 works

### ✅ Story 1.2: Upload Audio File

**Test at**: http://localhost:3000/record

**What to test:**
- [ ] Upload valid MP3 file (works)
- [ ] Upload valid WAV file (works)
- [ ] Upload invalid PDF file (shows error)
- [ ] Upload file > 10MB (shows error)
- [ ] Upload valid file < 1 second (may show warning)

### ✅ Story 1.3: Transcribe

**Test at**: http://localhost:3000/record/{id}

**What to test:**
- [ ] "Transcribe" button appears after upload
- [ ] Click "Transcribe" - status shows "Transcribing..."
- [ ] Transcription text appears when complete
- [ ] Language is detected (shows "en" or other)

### ✅ Story 1.4: Edit Transcription

**Test at**: http://localhost:3000/record/{id}

**What to test:**
- [ ] Transcription text is editable
- [ ] Character count updates as you type
- [ ] Word count updates
- [ ] Save button works
- [ ] Auto-save works (after 2 seconds of no typing)
- [ ] Cancel button restores original text

### ✅ Story 1.5: Amplify into Posts

**Test at**: http://localhost:3000/record/{id}

**What to test:**
- [ ] "Amplify into Posts" button appears after transcription
- [ ] Click "Amplify" - status shows "Structuring your thoughts…"
- [ ] Wait for amplification (10-30 seconds)
- [ ] Redirects to /record/{id}/posts

### ✅ Story 1.6: View Post Variations

**Test at**: http://localhost:3000/record/{id}/posts

**What to test:**
- [ ] All 5 variations are displayed
- [ ] Each has a label:
  - Professional Thought Leadership
  - Personal Story
  - Actionable Tips
  - Discussion Starter
  - Bold Opinion
- [ ] Click on variation - it's selected/highlighted
- [ ] Edit button appears
- [ ] Publish button appears

## Test Endpoints

### Check Auth Status
```bash
curl http://localhost:3000/api/test-auth
```

Should return:
```json
{
  "supabaseConnected": true,
  "authAvailable": true/false,
  "hasUser": true/false,
  "testMode": true/false,
  "message": "..."
}
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## Common Issues & Solutions

### ❌ "Supabase connection failed"

**Solution:**
1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is active
3. Test with: `curl http://localhost:3000/api/test-auth`

### ❌ "Transcription failed"

**Solution:**
1. Check `ASSEMBLYAI_API_KEY` is set correctly
2. Verify you have AssemblyAI credits
3. Check API key is valid

### ❌ "Amplification failed"

**Solution:**
1. Check `OPENROUTER_API_KEY` is set correctly
2. Verify you have OpenRouter credits
3. Check API key has access to `anthropic/claude-3.5-sonnet`
4. Try with a shorter transcription first

### ❌ "Build failed"

**Solution:**
1. Check TypeScript errors: `npm run type-check`
2. Check for missing dependencies: `npm install`
3. Check `.env.local` has all required variables

### ❌ "404 Not Found"

**Solution:**
1. Make sure `npm run dev` is running
2. Check you're visiting correct URL
3. Check browser console for errors

## Test Checklist

### Full Flow Test ✅
- [ ] Record 30-second voice note
- [ ] Upload recording
- [ ] Transcribe recording
- [ ] Edit transcription
- [ ] Amplify into 5 posts
- [ ] View all variations

### Edge Cases ✅
- [ ] Upload invalid file type → Shows error
- [ ] Upload file > 10MB → Shows error
- [ ] Record > 3 minutes → Auto-stops
- [ ] Transcription fails → Shows error
- [ ] Amplification fails → Shows error

### UI/UX ✅
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Navigation makes sense
- [ ] Buttons work as expected

## Expected Behavior

### ✅ Should Work
- Recording voice notes
- Uploading audio files
- Transcribing via AssemblyAI
- Editing transcriptions
- Amplifying into 5 post variations
- Viewing post variations with labels

### ⚠️ Known Limitations
- Uses placeholder auth (no real users yet)
- Credits aren't deducted
- Transcriptions aren't cached
- No multi-workspace support

## After Testing

Once you've tested Epic 1:
1. ✅ Epic 1 is complete!
2. ⏳ Next: Epic 2 (Auth & Workspace)
3. ⏳ Then: More features

## Need Help?

- **Quick Start**: See [START_HERE.md](./START_HERE.md)
- **Detailed Guide**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Status**: See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)

---

**Ready?** Run `npm run dev` and visit **http://localhost:3000/test** 🚀

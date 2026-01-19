# Suflate Quick Start Guide

## ✅ You Can Test Now!

Even though Epic 2 (Auth & Workspace) isn't complete, you can fully test all Epic 1 features right now.

## Step 1: Verify Environment Variables

Your `.env.local` file should have:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# APIs (required)
ASSEMBLYAI_API_KEY=your-assemblyai-key
OPENROUTER_API_KEY=your-openrouter-key

# App (optional but recommended)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Start the App

```bash
npm run dev
```

Visit: **http://localhost:3000**

## Step 3: Test the Features

### 🎤 Test Voice Recording (Story 1.1 & 1.2)

1. Go to: **http://localhost:3000/record**
2. Click the microphone button to record
3. Or click "Upload Audio File" to upload an existing file

**What works:**
- ✅ Record voice up to 3 minutes
- ✅ Pause/resume recording
- ✅ Waveform visualization
- ✅ Playback before upload
- ✅ File upload with validation

### 🎯 Test Transcription (Story 1.3)

1. After uploading a recording, you'll be redirected to `/record/{id}`
2. Click the **"Transcribe"** button
3. Wait for transcription to complete
4. See the transcribed text

**What works:**
- ✅ AssemblyAI transcription
- ✅ Automatic transcription processing
- ✅ Language detection
- ✅ Transcription storage

### ✏️ Test Editing (Story 1.4)

1. After transcription appears, edit the text
2. Make changes to the transcription
3. Click **"Save"** (or wait 2 seconds for auto-save)
4. Changes are saved

**What works:**
- ✅ Editable transcription field
- ✅ Auto-save after 2 seconds
- ✅ Character and word count
- ✅ Manual save button

### 🚀 Test Amplification (Story 1.5)

1. After editing transcription, click **"Amplify into Posts"**
2. Wait for amplification to complete (may take 10-30 seconds)
3. You'll be redirected to `/record/{id}/posts`

**What works:**
- ✅ OpenRouter API integration
- ✅ 5 post variations generation
- ✅ Voice preservation
- ✅ Different angles (professional, personal, actionable, discussion, bold)

### 📋 Test Post Variations (Story 1.6)

1. View all 5 post variations on `/record/{id}/posts`
2. Each variation has a label
3. Click on a variation to select it
4. Use Edit and Publish buttons (UI ready, functionality coming)

**What works:**
- ✅ Display all 5 variations
- ✅ Clear labels for each type
- ✅ Selection and highlighting
- ✅ Edit/Publish buttons

## Quick Test Checklist

Visit: **http://localhost:3000/test**

This page shows:
- ✅ Authentication status
- ✅ Supabase connection status
- ✅ Test mode status
- ✅ Quick links to test all features

## Test Endpoints

### Check Auth Status
```bash
curl http://localhost:3000/api/test-auth
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Known Limitations (Before Epic 2)

1. **Placeholder Authentication**: Uses `placeholder-user-id` and `placeholder-workspace-id`
   - All test data uses the same workspace
   - No user isolation (yet)
   
2. **No Credit System**: Credits aren't deducted (TODO in code)

3. **No Caching**: Transcriptions aren't cached (TODO in code)

## What to Test

### ✅ Full Flow Test

1. **Record** a 30-second voice note about anything
2. **Transcribe** it automatically
3. **Edit** the transcription (fix any errors)
4. **Amplify** into 5 post variations
5. **View** all variations with labels

### ✅ Edge Cases

1. **File Upload**: Try uploading invalid files (wrong type, too large)
2. **Transcription Errors**: What happens if AssemblyAI fails?
3. **Amplification Errors**: What happens if OpenRouter fails?

### ✅ UI/UX

1. **Loading States**: Are they clear?
2. **Error Messages**: Are they helpful?
3. **Navigation**: Does it make sense?

## Troubleshooting

### "Supabase connection failed"
- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is active

### "Transcription failed"
- Check `ASSEMBLYAI_API_KEY` is set correctly
- Verify you have AssemblyAI credits

### "Amplification failed"
- Check `OPENROUTER_API_KEY` is set correctly
- Verify you have OpenRouter credits
- Check API key has access to the model you're using

### "API route not found"
- Make sure you're running `npm run dev`
- Check the route exists in `app/api/`

## Next Steps

After testing Epic 1, we'll implement:
- Epic 2: Auth & Workspace (real authentication)
- Epic 3: Draft Management
- Epic 4: Post Scheduling
- And more...

## Need Help?

- See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions
- See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for feature status
- Check console logs for error messages

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranscriptionEditor } from '@/components/features/transcription-editor/transcription-editor'

// Mock fetch
global.fetch = jest.fn()

describe('TranscriptionEditor Component - Story 1.4', () => {
  const defaultTranscription = {
    id: 'test-transcription-id',
    recording_id: 'test-recording-id',
    raw_text: 'This is the original transcription text.',
    processed_text: 'This is the original transcription text.',
    detected_language: 'en',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Given I have a transcribed voice note', () => {
    test('When I view the transcript, Then I see an editable text field with the transcript', () => {
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveValue('This is the original transcription text.')
    })

    test('When I view the transcript, Then I can edit any part of the text', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const textarea = screen.getByRole('textbox')
      
      // Clear and type new text
      await user.clear(textarea)
      await user.type(textarea, 'This is my edited transcription.')

      expect(textarea).toHaveValue('This is my edited transcription.')
    })

    test('When I edit the transcript, Then changes are saved to the database when I click "Save"', async () => {
      const user = userEvent.setup({ delay: null })
      const onSave = jest.fn().mockResolvedValue({ success: true })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={onSave}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Edited text')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            processed_text: 'Edited text',
          })
        )
      })
    })

    test('When I edit the transcript, Then I can see a character count', () => {
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const originalLength = defaultTranscription.raw_text.length
      expect(screen.getByText(new RegExp(`${originalLength}`, 'i'))).toBeInTheDocument()
    })

    test('When I edit the transcript, Then character count updates as I type', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'New text')

      await waitFor(() => {
        expect(screen.getByText(/8/i)).toBeInTheDocument() // "New text" is 8 characters
      })
    })
  })

  describe('Given I am editing a transcription', () => {
    test('When I make changes, Then I see a "Save" button', () => {
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeInTheDocument()
    })

    test('When I click "Save", Then the edited text is saved to processed_text', async () => {
      const user = userEvent.setup({ delay: null })
      const onSave = jest.fn().mockResolvedValue({ success: true })

      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={onSave}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Updated transcription text')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
          id: defaultTranscription.id,
          processed_text: 'Updated transcription text',
        })
      })
    })

    test('When I click "Save", Then I see a success message', async () => {
      const user = userEvent.setup({ delay: null })
      const onSave = jest.fn().mockResolvedValue({ success: true })

      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={onSave}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, ' additional text')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument()
      })
    })

    test('When save fails, Then I see an error message', async () => {
      const user = userEvent.setup({ delay: null })
      const onSave = jest.fn().mockRejectedValue(new Error('Save failed'))

      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={onSave}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, ' additional text')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    test('When I click "Cancel", Then my changes are discarded and original text is restored', async () => {
      const user = userEvent.setup({ delay: null })
      
      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={jest.fn()}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'This should be discarded')

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(textarea).toHaveValue(defaultTranscription.raw_text)
    })
  })

  describe('Given I have edited a transcription', () => {
    test('When I save changes, Then the edited text is used for amplification instead of raw_text', async () => {
      const user = userEvent.setup({ delay: null })
      const onSave = jest.fn().mockResolvedValue({ success: true })

      render(
        <TranscriptionEditor
          transcription={defaultTranscription}
          onSave={onSave}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'This edited text will be used for amplification')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            processed_text: 'This edited text will be used for amplification',
          })
        )
      })
    })
  })
})

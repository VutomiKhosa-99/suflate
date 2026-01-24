import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoveToWorkspaceDialog } from '@/components/features/drafts/move-to-workspace-dialog'

// Mock fetch
global.fetch = jest.fn()

const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Personal Workspace',
    plan: 'starter',
    role: 'owner',
    credits_remaining: 100,
    credits_total: 100,
  },
  {
    id: 'workspace-2',
    name: 'Client A',
    plan: 'agency',
    role: 'admin',
    credits_remaining: 500,
    credits_total: 750,
  },
  {
    id: 'workspace-3',
    name: 'Client B',
    plan: 'creator',
    role: 'editor',
    credits_remaining: 200,
    credits_total: 250,
  },
]

describe('MoveToWorkspaceDialog - Story 3.8', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Given I have multiple workspaces', () => {
    it('When I open the move dialog, Then I see a list of available workspaces', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        // Current workspace (workspace-1) should be filtered out
        expect(screen.getByText('Client A')).toBeInTheDocument()
        expect(screen.getByText('Client B')).toBeInTheDocument()
        expect(screen.queryByText('Personal Workspace')).not.toBeInTheDocument()
      })
    })

    it('When I select a workspace, Then the selection is highlighted', async () => {
      const user = userEvent.setup({ delay: null })
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      const clientAButton = screen.getByText('Client A').closest('button')
      await user.click(clientAButton!)

      // Check if it's selected (has check mark or different style)
      expect(clientAButton).toHaveClass('border-blue-500')
    })

    it('When I click "Move Draft" after selecting a workspace, Then onMove is called', async () => {
      const user = userEvent.setup({ delay: null })
      const onMove = jest.fn().mockResolvedValue(undefined)
      const onClose = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={onMove}
          onClose={onClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      // Select a workspace
      const clientAButton = screen.getByText('Client A').closest('button')
      await user.click(clientAButton!)

      // Click Move Draft button
      const moveButton = screen.getByRole('button', { name: /move draft/i })
      await user.click(moveButton)

      await waitFor(() => {
        expect(onMove).toHaveBeenCalledWith('workspace-2')
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('Given the dialog is loading', () => {
    it('When I view the dialog, Then I see a loading indicator', async () => {
      // Mock a slow response
      ;(fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText(/loading workspaces/i)).toBeInTheDocument()
    })
  })

  describe('Given I have only one workspace', () => {
    it('When I open the move dialog, Then I see a message that no other workspaces are available', async () => {
      // Return only the current workspace
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: [mockWorkspaces[0]] }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no other workspaces available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Given the API returns an error', () => {
    it('When I open the move dialog, Then I see an error message', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch workspaces/i)).toBeInTheDocument()
      })
    })
  })

  describe('Given the move operation fails', () => {
    it('When I click "Move Draft", Then I see an error message', async () => {
      const user = userEvent.setup({ delay: null })
      const onMove = jest.fn().mockRejectedValue(new Error('Failed to move draft'))
      const onClose = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={onMove}
          onClose={onClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      // Select a workspace
      const clientAButton = screen.getByText('Client A').closest('button')
      await user.click(clientAButton!)

      // Click Move Draft button
      const moveButton = screen.getByRole('button', { name: /move draft/i })
      await user.click(moveButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to move draft/i)).toBeInTheDocument()
        // Dialog should still be open
        expect(onClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('Given the dialog is closed', () => {
    it('When isOpen is false, Then nothing is rendered', () => {
      render(
        <MoveToWorkspaceDialog
          isOpen={false}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.queryByText(/move to workspace/i)).not.toBeInTheDocument()
    })
  })

  describe('Dialog controls', () => {
    it('When I click Cancel, Then onClose is called', async () => {
      const user = userEvent.setup({ delay: null })
      const onClose = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={onClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('When I click the backdrop, Then onClose is called', async () => {
      const user = userEvent.setup({ delay: null })
      const onClose = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={onClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      // Find and click the backdrop
      const backdrop = document.querySelector('.bg-black\\/50')
      if (backdrop) {
        await user.click(backdrop)
      }

      expect(onClose).toHaveBeenCalled()
    })

    it('When I click the X button, Then onClose is called', async () => {
      const user = userEvent.setup({ delay: null })
      const onClose = jest.fn()

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={onClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Move Draft button state', () => {
    it('When no workspace is selected, Then Move Draft button is disabled', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workspaces: mockWorkspaces }),
      })

      render(
        <MoveToWorkspaceDialog
          isOpen={true}
          postId="post-123"
          currentWorkspaceId="workspace-1"
          onMove={jest.fn()}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Client A')).toBeInTheDocument()
      })

      const moveButton = screen.getByRole('button', { name: /move draft/i })
      expect(moveButton).toBeDisabled()
    })
  })
})

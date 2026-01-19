import { render } from '@testing-library/react'
import { WaveformVisualizer } from '@/components/features/voice-recorder/waveform-visualizer'

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn()

describe('WaveformVisualizer Component - Story 1.10', () => {
  const mockAnalyser = {
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn(),
  } as unknown as AnalyserNode

  const mockDataArray = new Uint8Array(128)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Given I am recording, When I speak into the microphone, Then I see a real-time waveform visualization', () => {
    const { container } = render(
      <WaveformVisualizer
        analyser={mockAnalyser}
        dataArray={mockDataArray}
        isActive={true}
      />
    )

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '800')
    expect(canvas).toHaveAttribute('height', '128')
  })

  test('When isActive is false, Then waveform does not update', () => {
    render(
      <WaveformVisualizer
        analyser={mockAnalyser}
        dataArray={mockDataArray}
        isActive={false}
      />
    )

    // Should not call getByteFrequencyData when inactive
    expect(mockAnalyser.getByteFrequencyData).not.toHaveBeenCalled()
  })

  test('When analyser is null, Then component renders but does not crash', () => {
    const { container } = render(
      <WaveformVisualizer
        analyser={null}
        dataArray={mockDataArray}
        isActive={true}
      />
    )

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })
})

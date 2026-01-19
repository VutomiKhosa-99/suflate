'use client'

interface Testimonial {
  name: string
  role: string
  company: string
  content: string
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Content Creator',
    company: 'Tech Insights',
    content: 'Suflate has transformed how I create LinkedIn content. What used to take me hours now takes minutes. The voice-to-post feature captures my natural speaking style perfectly.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CEO',
    company: 'Growth Labs',
    content: 'As a busy executive, I don&apos;t have time to write posts. Suflate lets me record my thoughts during commutes and turns them into polished LinkedIn content. Game changer!',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Director',
    company: 'Digital First',
    content: 'Our team uses Suflate daily. The multiple post variations help us A/B test what resonates best with our audience. Engagement has increased 300%.',
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by creators and teams
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about Suflate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">&quot;{testimonial.content}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

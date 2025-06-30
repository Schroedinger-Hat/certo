import { z } from 'zod'

const sections = z.enum(['certificate', 'recipient', 'export'])

const content = z.object({
  title: z.string(),
  features: z.array(z.string()).min(1),
})

const _dashboardSectionSchema = z.object({
  content: content.optional(),
  features: z.array(z.string()).min(1),
  header: z.string(),
  id: sections,
  title: z.string(),
})

const _dashboardFeatureCard = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string()
})

export type DashboardSection = z.infer<typeof _dashboardSectionSchema>
export type DashboardFeatureCard = z.infer<typeof _dashboardFeatureCard>

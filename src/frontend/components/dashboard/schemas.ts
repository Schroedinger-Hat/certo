import { z } from 'zod'

const sections = z.enum(['certificate', 'recipient', 'export'])

const dashboardContent = z.object({
  title: z.string(),
  features: z.array(z.string()).min(1),
})

const _dashboardSectionSchema = z.object({
  content: dashboardContent.optional(),
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

const _dashboardTrustee = z.object({
  url: z.string().url(),
  img: z.object({
    src: z.string().url(),
    alt: z.string().min(1)
  }),
})

export type DashboardSection = z.infer<typeof _dashboardSectionSchema>
export type DashboardFeatureCard = z.infer<typeof _dashboardFeatureCard>
export type DashboardTrustee = z.infer<typeof _dashboardTrustee>

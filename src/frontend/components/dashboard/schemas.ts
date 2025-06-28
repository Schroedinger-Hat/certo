import { z } from 'zod'

const _dashboardSectionSchema = z.object({
  features: z.array(z.string()).min(1),
  header: z.string(),
  title: z.string(),
})

export type DashboardSection = z.infer<typeof _dashboardSectionSchema>

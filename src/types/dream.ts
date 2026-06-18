export interface Dream {
  id: string
  title: string
  description: string // HTML string z TipTap
  tags: string[]
  photoUrls: string[]
  createdAt: string   // ISO string – nigdy natywny Date
}

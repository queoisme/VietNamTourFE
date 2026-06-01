export interface Feature {
  id: string
  key: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PlanFeaturesResponse {
  plan: string
  features: Feature[]
}

export interface MyFeaturesResponse {
  plan: string
  featureKeys: string[]
}

export interface CreateFeatureRequest {
  key: string
  name: string
  description: string
}

export interface UpdateFeatureRequest {
  name?: string
  description?: string
  isActive?: boolean
}

export interface AssignFeatureRequest {
  featureId: string
}

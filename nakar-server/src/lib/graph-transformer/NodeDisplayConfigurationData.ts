export type NodeDisplayConfigurationData = {
  id: string
  displayTitle: string
  labels: string[]
  properties: Record<string, string>
  radius: number
  inDegree: number
  outDegree: number
  degree: number
}
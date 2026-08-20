import toolInfo from '@/routes/tools/info.json'

export type ToolId = keyof typeof toolInfo
export type ToolInfo = (typeof toolInfo)[ToolId]

export { toolInfo }

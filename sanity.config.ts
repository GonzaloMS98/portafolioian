import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {dataset, projectId} from './lib/sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

export default defineConfig({
  name: 'default',
  title: 'Ian Montaño Portfolio',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool({structure}), visionTool()],
  schema: {types: schemaTypes},
})

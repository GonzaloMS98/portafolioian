import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from './env'

export const sanityClient = projectId
  ? createClient({projectId, dataset, apiVersion, useCdn: true})
  : null

import {defineArrayMember, defineField, defineType} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'organization', title: 'Organization'},
  ],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', group: 'content', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', group: 'organization', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'section', title: 'Section', type: 'reference', group: 'organization', to: [{type: 'workSection'}], validation: (rule) => rule.required()}),
    defineField({name: 'order', title: 'Order', type: 'number', group: 'organization', initialValue: 0, validation: (rule) => rule.integer().min(0)}),
    defineField({name: 'type', title: 'Project type', type: 'string', group: 'content'}),
    defineField({name: 'year', title: 'Year', type: 'string', group: 'content'}),
    defineField({
      name: 'body',
      title: 'Editorial text',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', group: 'media', options: {hotspot: true}, validation: (rule) => rule.required()}),
    defineField({name: 'videoFile', title: 'Video file', type: 'file', group: 'media', options: {accept: 'video/mp4'}}),
    defineField({
      name: 'externalVideoUrl',
      title: 'External video URL',
      description: 'Used when no uploaded video file is provided.',
      type: 'url',
      group: 'media',
    }),
    defineField({
      name: 'btsImages',
      title: 'Behind-the-scenes images',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
    }),
    defineField({
      name: 'galleryVideos',
      title: 'Additional / BTS videos',
      description: 'Additional reels and behind-the-scenes clips shown in the project gallery.',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({type: 'file', options: {accept: 'video/mp4'}})],
    }),
  ],
  orderings: [{title: 'Manual order', name: 'manualOrder', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', section: 'section.label', media: 'coverImage'},
    prepare: ({title, section, media}) => ({title, subtitle: section, media}),
  },
})
